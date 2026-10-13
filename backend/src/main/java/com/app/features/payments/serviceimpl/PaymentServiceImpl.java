package com.app.features.payments.serviceimpl;
import com.app.features.orders.service.OrderStatusHistoryService;
import com.app.features.notifications.dto.MailEventDto.PaymentSucceededMailEvent;

import com.app.common.*;
import com.app.features.auth.security.CurrentUser;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.payments.dto.PaymentServiceDto.IpnResult;
import com.app.features.payments.dto.PaymentServiceDto.PaymentStatus;
import com.app.features.payments.dto.PaymentServiceDto.PaymentUrl;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.entity.PaymentTransaction;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.payments.repository.PaymentTransactionRepository;
import com.app.features.payments.service.PaymentService;
import com.app.features.payments.util.VnpaySignature;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository payments; private final PaymentTransactionRepository transactions; private final OrderRepository orders; private final CurrentUser current; private final OrderStatusHistoryService history; private final ApplicationEventPublisher events;
    @Value("${app.vnpay.tmn-code}") private String tmnCode;
    @Value("${app.vnpay.hash-secret}") private String hashSecret;
    @Value("${app.vnpay.pay-url}") private String payUrl;
    @Value("${app.vnpay.return-url}") private String returnUrl;
    public PaymentServiceImpl(PaymentRepository payments, PaymentTransactionRepository transactions, OrderRepository orders, CurrentUser current, OrderStatusHistoryService history, ApplicationEventPublisher events) { this.payments = payments; this.transactions = transactions; this.orders = orders; this.current = current; this.history = history; this.events = events; }
    @Transactional public PaymentUrl create(Long orderId, HttpServletRequest request) {
        if (tmnCode.isBlank() || hashSecret.isBlank()) throw BusinessException.bad("VNPAY_NOT_CONFIGURED", "Chưa cấu hình VNPAY Sandbox");
        MarketOrder order = orders.findById(orderId).orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden();
        if (!"VNPAY".equals(order.getPaymentMethod()) || "CANCELLED".equals(order.getStatus())) throw BusinessException.bad("INVALID_PAYMENT", "Đơn hàng không thể thanh toán qua VNPAY");
        if (payments.existsByOrderIdAndStatus(orderId, "PAID")) throw BusinessException.conflict("ALREADY_PAID", "Đơn hàng đã thanh toán");
        List<Payment> attempts = payments.findByOrderIdOrderByCreatedAtDesc(orderId);
        Payment payment = attempts.stream().filter(p -> "PENDING".equals(p.getStatus()) && p.getTxnRef() == null).findFirst().orElseGet(() -> { Payment p = new Payment(); p.setOrder(order); p.setProvider("VNPAY"); p.setAmount(order.getTotalAmount()); return p; });
        if (attempts.stream().anyMatch(p -> "PENDING".equals(p.getStatus()) && p.getTxnRef() != null)) throw BusinessException.conflict("PAYMENT_PENDING", "Đã tạo yêu cầu thanh toán; vui lòng chờ kết quả");
        payment.setTxnRef(UUID.randomUUID().toString().replace("-", "")); payments.save(payment);
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")); DateTimeFormatter format = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        Map<String, String> params = new HashMap<>(); params.put("vnp_Version", "2.1.0"); params.put("vnp_Command", "pay"); params.put("vnp_TmnCode", tmnCode); params.put("vnp_Amount", order.getTotalAmount().multiply(BigDecimal.valueOf(100)).toBigIntegerExact().toString()); params.put("vnp_CurrCode", "VND"); params.put("vnp_TxnRef", payment.getTxnRef()); params.put("vnp_OrderInfo", "Thanh toan don hang " + order.getOrderCode()); params.put("vnp_OrderType", "other"); params.put("vnp_Locale", "vn"); params.put("vnp_ReturnUrl", returnUrl); params.put("vnp_IpAddr", request.getRemoteAddr()); params.put("vnp_CreateDate", now.format(format)); params.put("vnp_ExpireDate", now.plusMinutes(15).format(format));
        String url = payUrl + "?" + VnpaySignature.query(params) + "&vnp_SecureHash=" + VnpaySignature.sign(params, hashSecret);
        return new PaymentUrl(url, payment.getTxnRef());
    }
    @Transactional(readOnly = true) public PaymentStatus status(String orderCode) {
        MarketOrder order = orders.findByOrderCode(orderCode).orElseThrow(() -> BusinessException.missing("Đơn hàng")); if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden();
        Payment payment = payments.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream().findFirst().orElseThrow(() -> BusinessException.missing("Thanh toán"));
        return new PaymentStatus(orderCode, payment.getProvider(), payment.getStatus(), payment.getAmount());
    }
    @Transactional public IpnResult ipn(Map<String, String> params) {
        if (hashSecret.isBlank() || !VnpaySignature.valid(params, hashSecret) || !tmnCode.equals(params.get("vnp_TmnCode"))) return new IpnResult("97", "Invalid checksum");
        Payment payment = payments.lockByTxnRef(params.getOrDefault("vnp_TxnRef", "")).orElse(null); if (payment == null) return new IpnResult("01", "Order not found");
        BigDecimal callbackAmount;
        try { callbackAmount = new BigDecimal(params.getOrDefault("vnp_Amount", "")); } catch (NumberFormatException ex) { return new IpnResult("04", "Invalid amount"); }
        if (callbackAmount.compareTo(payment.getAmount().multiply(BigDecimal.valueOf(100))) != 0) return new IpnResult("04", "Invalid amount");
        if (!"PENDING".equals(payment.getStatus())) return new IpnResult("02", "Already processed");
        if ("CANCELLED".equals(payment.getOrder().getStatus())) return new IpnResult("02", "Order cancelled");
        boolean success = "00".equals(params.get("vnp_ResponseCode")) && "00".equals(params.get("vnp_TransactionStatus"));
        payment.setStatus(success ? "PAID" : "FAILED"); payment.setResponseCode(params.get("vnp_ResponseCode")); payment.setProviderTransactionNo(params.get("vnp_TransactionNo")); if (success) { payment.setPaidAt(Instant.now()); payment.getOrder().setStatus("PAID"); history.record(payment.getOrder(), "PAID", null, "VNPAY IPN"); var order = payment.getOrder(); events.publishEvent(new PaymentSucceededMailEvent(order.getUser().getEmail(), order.getFullName(), order.getOrderCode(), payment.getProviderTransactionNo() == null ? payment.getTxnRef() : payment.getProviderTransactionNo(), payment.getAmount(), payment.getPaidAt(), "VNPAY", order.getAddress(), List.of())); }
        PaymentTransaction log = new PaymentTransaction(); log.setPayment(payment); log.setEventType("IPN"); log.setSignatureValid(true); log.setResponseCode(params.get("vnp_ResponseCode")); log.setProviderTransactionNo(params.get("vnp_TransactionNo")); transactions.save(log);
        return new IpnResult("00", "Confirm Success");
    }
    @Transactional(readOnly = true) public String returnOrderCode(Map<String, String> params) {
        if (hashSecret.isBlank() || !VnpaySignature.valid(params, hashSecret) || !tmnCode.equals(params.get("vnp_TmnCode"))) return null;
        return payments.findByTxnRef(params.getOrDefault("vnp_TxnRef", "")).map(p -> p.getOrder().getOrderCode()).orElse(null);
    }
}
