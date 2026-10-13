package com.app.features.payments.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.auth.security.CurrentUser;
import com.app.features.notifications.dto.MailEventDto.OrderItemMail;
import com.app.features.notifications.dto.MailEventDto.PaymentSucceededMailEvent;
import com.app.features.notifications.entity.Notification;
import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.repository.NotificationRepository;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.OrderItem;
import com.app.features.orders.repository.OrderItemRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.service.OrderStatusHistoryService;
import com.app.features.payments.dto.PayOSPaymentDto.CreateResponse;
import com.app.features.payments.dto.PayOSPaymentDto.StatusResponse;
import com.app.features.payments.dto.PayOSPaymentDto.WebhookResponse;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.entity.PaymentTransaction;
import com.app.features.payments.provider.PayOSPaymentProvider;
import com.app.features.payments.provider.PaymentProviderDto;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.payments.repository.PaymentTransactionRepository;
import com.app.features.payments.service.PayOSPaymentService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.model.webhooks.Webhook;
import com.app.features.promotions.service.VoucherService;

@Service
@Slf4j
public class PayOSPaymentServiceImpl implements PayOSPaymentService {
    private final PaymentRepository payments;
    private final PaymentTransactionRepository transactions;
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final NotificationRepository notifications;
    private final CurrentUser current;
    private final PayOSPaymentProvider provider;
    private final OrderStatusHistoryService history;
    private final ApplicationEventPublisher events;
    private final VoucherService voucherService;

    public PayOSPaymentServiceImpl(PaymentRepository payments, PaymentTransactionRepository transactions,
            OrderRepository orders, OrderItemRepository orderItems, NotificationRepository notifications,
            CurrentUser current, PayOSPaymentProvider provider, OrderStatusHistoryService history,
            ApplicationEventPublisher events,VoucherService voucherService) {
        this.payments = payments; this.transactions = transactions; this.orders = orders;
        this.orderItems = orderItems; this.notifications = notifications; this.current = current;
        this.provider = provider; this.history = history; this.events = events;this.voucherService=voucherService;
    }

    @Override
    @Transactional
    public CreateResponse create(Long orderId) {
        MarketOrder order = orders.lockById(orderId).orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden();
        if (!"PAYOS".equals(order.getPaymentMethod()) || "CANCELLED".equals(order.getStatus()))
            throw BusinessException.bad("INVALID_PAYMENT", "Đơn hàng không thể thanh toán qua payOS");
        if (payments.existsByOrderIdAndStatus(orderId, "PAID"))
            throw BusinessException.conflict("PAYMENT_ALREADY_PAID", "Đơn hàng đã thanh toán");

        Payment payment = payments.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(orderId, "PAYOS").orElse(null);
        if (isReusable(payment)) {
            log.info("Reuse payOS payment {} for order {}", payment.getId(), orderId);
            return response(order, payment);
        }
        if (payment != null && "PENDING".equals(payment.getStatus()) && payment.getProviderPaymentLinkId() != null)
            payment.setStatus("CANCELLED");
        if (payment == null || payment.getProviderPaymentLinkId() != null || !"PENDING".equals(payment.getStatus())) {
            payment = new Payment(); payment.setOrder(order); payment.setProvider("PAYOS"); payment.setAmount(order.getTotalAmount());
        }
        payment = payments.saveAndFlush(payment);
        payment.setProviderOrderCode(payment.getId());
        payment.setTxnRef("PAYOS-" + payment.getId());

        log.info("Creating payOS payment for order {}", orderId);
        PaymentProviderDto.CreateResult created = provider.createPayment(order, payment);
        if (created.orderCode() == null || created.amount() == null || !payment.getProviderOrderCode().equals(created.orderCode()) ||
                BigDecimal.valueOf(created.amount()).compareTo(order.getTotalAmount()) != 0)
            throw BusinessException.bad("PAYOS_RESPONSE_MISMATCH", "Dữ liệu thanh toán payOS không khớp với đơn hàng");
        payment.setProviderPaymentLinkId(created.paymentLinkId());
        payment.setCheckoutUrl(created.checkoutUrl());
        payment.setQrCode(created.qrCode());
        payment.setExpiresAt(created.expiresAt());
        payments.save(payment);
        return response(order, payment);
    }

    @Override
    @Transactional
    public StatusResponse status(Long orderId) {
        MarketOrder order = orders.findById(orderId).orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden();
        Payment latest = payments.findByOrderIdOrderByCreatedAtDesc(orderId).stream().findFirst()
            .orElseThrow(() -> BusinessException.missing("Thanh toán"));
        Payment payment = payments.lockById(latest.getId()).orElseThrow(() -> BusinessException.missing("Thanh toán"));

        if (shouldReconcile(payment)) {
            try {
                PaymentProviderDto.StatusResult remote = provider.getPaymentStatus(payment);
                validateRemoteStatus(payment, remote);
                if ("PAID".equals(remote.status())) {
                    if (remote.amountPaid() == null || BigDecimal.valueOf(remote.amountPaid()).compareTo(payment.getAmount()) != 0)
                        throw BusinessException.bad("PAYMENT_AMOUNT_MISMATCH", "Số tiền payOS đã nhận không khớp đơn hàng");
                    if (remote.transactionId() == null || remote.transactionId().isBlank())
                        throw BusinessException.bad("PAYOS_TRANSACTION_MISSING", "payOS chưa trả mã giao dịch");
                    completePayment(payment, remote.transactionId(), "00", "PAYOS_STATUS_RECONCILE", "Đối soát API payOS");
                } else if (List.of("CANCELLED", "EXPIRED").contains(remote.status())) {
                    payment.setStatus("CANCELLED");
                } else if ("FAILED".equals(remote.status())) {
                    payment.setStatus("FAILED");
                }
            } catch (BusinessException ex) {
                if (ex.code().startsWith("PAYMENT_") || ex.code().startsWith("PAYOS_TRANSACTION") || ex.code().startsWith("PAYOS_STATUS")) throw ex;
                log.warn("Could not refresh payOS status for payment {}: {}", payment.getId(), ex.getMessage());
            }
        }
        return new StatusResponse(order.getId(), order.getOrderCode(), payment.getProvider(), payment.getStatus(),
            order.getStatus(), payment.getAmount(), payment.getPaidAt());
    }

    @Override
    @Transactional
    public WebhookResponse handleWebhook(Webhook webhook) {
        log.info("payOS webhook received");
        PaymentProviderDto.WebhookResult verified = provider.verifyWebhook(webhook);
        if (verified.orderCode() == null || verified.amount() == null)
            throw BusinessException.bad("INVALID_PAYOS_WEBHOOK", "Webhook payOS thiếu dữ liệu bắt buộc");
        Payment payment = payments.lockByProviderOrderCode(verified.orderCode()).orElse(null);
        if (payment == null) {
            log.warn("Verified payOS webhook has no matching payment for orderCode {}", verified.orderCode());
            return new WebhookResponse(true, "Webhook hợp lệ, chưa có payment tương ứng");
        }
        validateWebhook(payment, verified);
        if ("PAID".equals(payment.getStatus()) || verified.transactionId() != null &&
                transactions.existsByProviderTransactionNo(verified.transactionId())) {
            log.warn("Duplicate payOS webhook for payment {}", payment.getId());
            return new WebhookResponse(true, "Webhook đã được xử lý");
        }
        if ("CANCELLED".equals(payment.getOrder().getStatus()))
            throw BusinessException.conflict("ORDER_CANCELLED", "Đơn hàng đã hủy");

        if (!Boolean.TRUE.equals(webhook.getSuccess()) || !"00".equals(verified.responseCode())) {
            saveTransaction(payment, "PAYOS_WEBHOOK", verified.transactionId(), verified.responseCode(),
                "orderCode=" + verified.orderCode() + ",amount=" + verified.amount());
            payment.setStatus("FAILED"); payment.setResponseCode(verified.responseCode());
            return new WebhookResponse(true, "Giao dịch không thành công");
        }
        completePayment(payment, verified.transactionId(), verified.responseCode(), "PAYOS_WEBHOOK", "payOS webhook đã xác minh");
        return new WebhookResponse(true, "Webhook xử lý thành công");
    }

    private void validateWebhook(Payment payment, PaymentProviderDto.WebhookResult data) {
        if (!"PAYOS".equals(payment.getProvider()))
            throw BusinessException.bad("INVALID_PAYOS_WEBHOOK", "Nhà cung cấp thanh toán không khớp");
        if (BigDecimal.valueOf(data.amount()).compareTo(payment.getAmount()) != 0) {
            log.warn("payOS amount mismatch for payment {}", payment.getId());
            throw BusinessException.bad("PAYMENT_AMOUNT_MISMATCH", "Số tiền webhook không khớp đơn hàng");
        }
        if (payment.getProviderPaymentLinkId() != null && data.paymentLinkId() != null &&
                !payment.getProviderPaymentLinkId().equals(data.paymentLinkId()))
            throw BusinessException.bad("INVALID_PAYOS_WEBHOOK", "Payment link không khớp");
    }

    private void validateRemoteStatus(Payment payment, PaymentProviderDto.StatusResult remote) {
        if (remote.orderCode() == null || !remote.orderCode().equals(payment.getProviderOrderCode()))
            throw BusinessException.bad("PAYOS_STATUS_MISMATCH", "Mã đơn payOS không khớp");
        if (remote.amount() == null || BigDecimal.valueOf(remote.amount()).compareTo(payment.getAmount()) != 0)
            throw BusinessException.bad("PAYMENT_AMOUNT_MISMATCH", "Số tiền payOS không khớp đơn hàng");
        if (payment.getProviderPaymentLinkId() != null && remote.paymentLinkId() != null &&
                !payment.getProviderPaymentLinkId().equals(remote.paymentLinkId()))
            throw BusinessException.bad("PAYOS_STATUS_MISMATCH", "Payment link payOS không khớp");
    }

    private boolean completePayment(Payment payment, String transactionId, String responseCode,
            String eventType, String historyNote) {
        if ("PAID".equals(payment.getStatus())) return false;
        if (transactionId != null && transactions.existsByProviderTransactionNo(transactionId)) return false;
        saveTransaction(payment, eventType, transactionId, responseCode,
            "orderCode=" + payment.getProviderOrderCode() + ",amount=" + payment.getAmount().toPlainString());
        Instant paidAt = Instant.now();
        payment.setStatus("PAID"); payment.setPaidAt(paidAt); payment.setResponseCode(responseCode);
        payment.setProviderTransactionNo(transactionId);
        MarketOrder order = payment.getOrder();
        order.setStatus("CONFIRMED");
        voucherService.redeem(order.getId());
        history.record(order, "CONFIRMED", null, historyNote);

        Notification notification = new Notification();
        notification.setRecipient(order.getUser()); notification.setType(NotificationType.PAYMENT);
        notification.setTitle("Thanh toán thành công");
        notification.setMessage("Đơn hàng " + order.getOrderCode() + " đã được thanh toán qua payOS.");
        notifications.save(notification);

        List<OrderItemMail> items = orderItems.findBySupplierOrderOrderId(order.getId()).stream().map(this::mailItem).toList();
        events.publishEvent(new PaymentSucceededMailEvent(order.getUser().getEmail(), order.getFullName(),
            order.getOrderCode(), transactionId, payment.getAmount(), paidAt, "payOS / Chuyển khoản ngân hàng",
            order.getAddress(), items));
        log.info("payOS payment {} succeeded for order {} via {}", payment.getId(), order.getId(), eventType);
        return true;
    }

    private void saveTransaction(Payment payment, String eventType, String transactionId,
            String responseCode, String payload) {
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPayment(payment); transaction.setEventType(eventType); transaction.setSignatureValid(true);
        transaction.setResponseCode(responseCode); transaction.setProviderTransactionNo(transactionId);
        transaction.setRequestPayload(payload); transactions.save(transaction);
    }

    private boolean shouldReconcile(Payment payment) {
        return "PAYOS".equals(payment.getProvider()) && payment.getProviderOrderCode() != null &&
            !List.of("PAID", "CANCELLED", "REFUNDED").contains(payment.getStatus());
    }

    private boolean isReusable(Payment payment) {
        return payment != null && "PENDING".equals(payment.getStatus()) && payment.getCheckoutUrl() != null &&
            payment.getExpiresAt() != null && payment.getExpiresAt().isAfter(Instant.now().plusSeconds(30));
    }

    private CreateResponse response(MarketOrder order, Payment payment) {
        return new CreateResponse(order.getId(), order.getOrderCode(), payment.getProviderOrderCode(), payment.getStatus(),
            payment.getCheckoutUrl(), payment.getQrCode(), payment.getAmount(), payment.getExpiresAt());
    }

    private OrderItemMail mailItem(OrderItem item) {
        return new OrderItemMail(item.getProductNameSnapshot(), item.getQuantity(), item.getUnit(),
            item.getUnitPrice(), item.getTotalAmount());
    }
}
