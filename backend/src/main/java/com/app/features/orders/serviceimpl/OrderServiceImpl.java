package com.app.features.orders.serviceimpl;
import com.app.features.orders.service.OrderStatusHistoryService;
import com.app.features.notifications.dto.MailEventDto.OrderItemMail;
import com.app.features.notifications.dto.MailEventDto.OrderPlacedMailEvent;

import com.app.common.*;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.cart.entity.CartItem;
import com.app.features.cart.repository.CartItemRepository;
import com.app.features.orders.dto.OrderServiceDto.CheckoutRequest;
import com.app.features.orders.dto.OrderServiceDto.OrderItemView;
import com.app.features.orders.dto.OrderServiceDto.OrderView;
import com.app.features.orders.dto.OrderServiceDto.SupplierOrderView;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.OrderItem;
import com.app.features.orders.entity.SupplierOrder;
import com.app.features.orders.enums.PaymentMethod;
import com.app.features.orders.repository.OrderItemRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.repository.SupplierOrderRepository;
import com.app.features.orders.service.OrderService;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.payments.provider.PayOSPaymentProvider;
import com.app.features.payments.provider.PaymentProviderDto;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import com.app.features.promotions.service.VoucherService;
import com.app.features.promotions.dto.VoucherDto.CheckoutQuote;
import com.app.features.promotions.dto.VoucherDto.SupplierDiscount;

@Service
public class OrderServiceImpl implements OrderService {
    private final CartItemRepository cart; private final ProductRepository products; private final OrderRepository orders; private final SupplierOrderRepository supplierOrders; private final OrderItemRepository orderItems; private final PaymentRepository payments; private final CurrentUser current; private final OrderStatusHistoryService history; private final ApplicationEventPublisher events; private final PayOSPaymentProvider payOSProvider; private final VoucherService voucherService; private final com.app.features.orders.service.PartnerOrderNotifier partnerNotifier; private final com.app.features.orders.service.BuyerOrderNotifier buyerNotifier;
    public OrderServiceImpl(CartItemRepository cart, ProductRepository products, OrderRepository orders, SupplierOrderRepository supplierOrders, OrderItemRepository orderItems, PaymentRepository payments, CurrentUser current, OrderStatusHistoryService history, ApplicationEventPublisher events, PayOSPaymentProvider payOSProvider, VoucherService voucherService, com.app.features.orders.service.PartnerOrderNotifier partnerNotifier, com.app.features.orders.service.BuyerOrderNotifier buyerNotifier) { this.cart = cart; this.products = products; this.orders = orders; this.supplierOrders = supplierOrders; this.orderItems = orderItems; this.payments = payments; this.current = current; this.history = history; this.events = events; this.payOSProvider = payOSProvider; this.voucherService=voucherService; this.partnerNotifier=partnerNotifier; this.buyerNotifier=buyerNotifier; }
    @Transactional public OrderView checkout(CheckoutRequest request) {
        if (request.fullName() == null || request.fullName().isBlank() || request.phone() == null || !request.phone().matches("0[0-9]{9}") || request.address() == null || request.address().isBlank()) throw BusinessException.bad("INVALID_SHIPPING", "Thông tin giao hàng không hợp lệ");
        String method = request.paymentMethod() == null ? "" : request.paymentMethod().toUpperCase(); if (Arrays.stream(PaymentMethod.values()).noneMatch(value -> value.name().equals(method))) throw BusinessException.bad("INVALID_PAYMENT_METHOD", "Phương thức thanh toán không hợp lệ");
        UserAccount user = current.get(); List<CartItem> items = cart.findByUserId(user.getId()); if (items.isEmpty()) throw BusinessException.bad("EMPTY_CART", "Giỏ hàng đang trống");
        CheckoutQuote quote=voucherService.quoteFor(user,request.address(),request.platformVoucherCode(),request.partnerVoucherCodes());
        Map<Long, Product> locked = new HashMap<>();
        for (Long id : items.stream().map(item -> item.getProduct().getId()).distinct().sorted().toList()) locked.put(id, products.lockById(id).orElseThrow(() -> BusinessException.missing("Sản phẩm")));
        BigDecimal total = BigDecimal.ZERO;
        Map<Long, BigDecimal> supplierTotals = new LinkedHashMap<>();
        for (CartItem item : items) {
            Product p = locked.get(item.getProduct().getId());
            if (!"APPROVED".equals(p.getSupplier().getStatus()) || !"APPROVED".equals(p.getApprovalStatus()) || !"ACTIVE".equals(p.getStatus()) || !p.getCategory().isActive()) throw BusinessException.bad("PRODUCT_UNAVAILABLE", p.getName() + " không còn được bán");
            if (item.getQuantity().signum() <= 0 || p.getStock().compareTo(item.getQuantity()) < 0) throw BusinessException.bad("PRODUCT_OUT_OF_STOCK", p.getName() + " không đủ tồn kho");
            BigDecimal line = p.getPrice().multiply(item.getQuantity()); total = total.add(line); supplierTotals.merge(p.getSupplier().getId(), line, BigDecimal::add);
        }
        if(total.compareTo(quote.subtotal())!=0) throw BusinessException.conflict("CART_CHANGED","Giỏ hàng vừa thay đổi, vui lòng kiểm tra lại báo giá");
        MarketOrder order = new MarketOrder(); order.setUser(user); order.setOrderCode("CM" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase()); order.setFullName(request.fullName().trim()); order.setPhone(request.phone()); order.setAddress(request.address().trim()); order.setNote(request.note()); order.setPaymentMethod(method); order.setSubtotal(total); order.setPartnerDiscount(quote.partnerDiscount());order.setPlatformDiscount(quote.platformDiscount());order.setDiscount(quote.partnerDiscount().add(quote.platformDiscount()));order.setShippingFee(quote.shippingFee());order.setShippingDiscount(quote.shippingDiscount());order.setShippingZone(quote.shippingZone());order.setTotalAmount(quote.totalAmount()); if (!"COD".equals(method)) order.setStatus("PENDING_PAYMENT"); orders.save(order); history.record(order, order.getStatus(), user, null);
        Map<Long, SupplierOrder> parts = new HashMap<>();
        for (var entry : supplierTotals.entrySet()) { SupplierDiscount d=quote.suppliers().stream().filter(s->s.supplierId().equals(entry.getKey())).findFirst().orElseThrow();SupplierOrder part = new SupplierOrder(); part.setOrder(order); part.setSupplier(locked.values().stream().filter(p -> p.getSupplier().getId().equals(entry.getKey())).findFirst().orElseThrow().getSupplier());part.setSubtotal(entry.getValue());part.setDiscount(d.discount());part.setTotalAmount(d.payable()); supplierOrders.save(part); parts.put(entry.getKey(), part); }
        for (CartItem item : items) {
            Product p = locked.get(item.getProduct().getId()); OrderItem snapshot = new OrderItem(); snapshot.setSupplierOrder(parts.get(p.getSupplier().getId())); snapshot.setProduct(p); snapshot.setProductNameSnapshot(p.getName()); snapshot.setUnitPrice(p.getPrice()); snapshot.setUnit(p.getUnit()); snapshot.setQuantity(item.getQuantity()); snapshot.setTotalAmount(p.getPrice().multiply(item.getQuantity())); orderItems.save(snapshot); p.setStock(p.getStock().subtract(item.getQuantity()));
        }
        voucherService.reserve(user,order,parts,quote,request.platformVoucherCode());if("COD".equals(method))voucherService.redeem(order.getId());
        Payment payment = new Payment(); payment.setOrder(order); payment.setProvider(method); payment.setAmount(order.getTotalAmount()); payments.save(payment);
        List<OrderItemMail> mailItems = items.stream().map(item -> {
            Product product = locked.get(item.getProduct().getId());
            return new OrderItemMail(product.getName(), item.getQuantity(), product.getUnit(), product.getPrice(), product.getPrice().multiply(item.getQuantity()));
        }).toList();
        events.publishEvent(new OrderPlacedMailEvent(user.getEmail(), order.getFullName(), order.getOrderCode(), method, order.getTotalAmount(), order.getAddress(), mailItems));
        if ("COD".equals(method)) partnerNotifier.orderReady(order);
        cart.deleteByUserId(user.getId());
        return view(order);
    }
    @Transactional public OrderView owned(Long id) { MarketOrder order = orders.findById(id).orElseThrow(() -> BusinessException.missing("Đơn hàng")); if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden(); return view(order); }
    @Transactional public OrderView ownedByCode(String code) { MarketOrder order = orders.findByOrderCode(code).orElseThrow(() -> BusinessException.missing("Đơn hàng")); if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden(); return view(order); }
    @Transactional public List<OrderView> mine() { return orders.findByUserIdOrderByCreatedAtDesc(current.get().getId()).stream().map(this::view).toList(); }
    @Transactional public OrderView cancel(Long id) {
        MarketOrder order = orders.lockById(id).orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden();
        if (!List.of("CREATED", "PENDING_PAYMENT").contains(order.getStatus())) throw BusinessException.conflict("ORDER_NOT_CANCELLABLE", "Đơn hàng không thể hủy");
        List<SupplierOrder> parts = supplierOrders.findByOrderId(id);
        if (parts.stream().anyMatch(part -> !"CREATED".equals(part.getStatus()))) throw BusinessException.conflict("ORDER_IN_PROGRESS", "Nhà cung cấp đã bắt đầu xử lý đơn");
        return cancelLocked(order, parts, "Khách hàng hủy đơn CleanMarket", null, current.get());
    }
    /** Staff cancellation: allowed until any supplier ships, and never for paid orders (those go through complaint and refund). */
    @Transactional public OrderView cancelByStaff(Long id, String reason) {
        MarketOrder order = orders.lockById(id).orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        if (List.of("SHIPPED", "DELIVERED", "CANCELLED").contains(order.getStatus())) throw BusinessException.conflict("ORDER_NOT_CANCELLABLE", "Đơn hàng đã hoàn tất hoặc đã hủy");
        List<SupplierOrder> parts = supplierOrders.findByOrderId(id);
        if (parts.stream().anyMatch(part -> List.of("SHIPPED", "DELIVERED").contains(part.getStatus()))) throw BusinessException.conflict("ORDER_SHIPPED", "Đơn hàng đã được giao đi nên không thể hủy");
        OrderView cancelled = cancelLocked(order, parts, "CleanMarket hủy đơn", reason, current.get());
        buyerNotifier.orderCancelled(order, "CleanMarket đã hủy đơn hàng của bạn. Lý do: " + reason + ". Hàng và voucher (nếu có) đã được hoàn lại.");
        return cancelled;
    }
    /**
     * Releases a payOS order the customer never paid once its payment window is over: link expiry if a link was issued,
     * otherwise order time + link TTL. Runs in its own transaction so a sweep never rolls back the request that triggered it.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW) public boolean expireUnpaid(Long id) {
        MarketOrder order = orders.lockById(id).orElse(null);
        if (order == null || !"PENDING_PAYMENT".equals(order.getStatus()) || !"PAYOS".equals(order.getPaymentMethod())) return false;
        Payment latest = payments.findByOrderIdOrderByCreatedAtDesc(id).stream().findFirst().orElse(null);
        if (latest == null || !"PENDING".equals(latest.getStatus())) return false;
        java.time.Instant deadline = latest.getExpiresAt() != null ? latest.getExpiresAt() : order.getCreatedAt().plusSeconds(linkTtlSeconds);
        if (java.time.Instant.now().isBefore(deadline.plusSeconds(EXPIRY_GRACE_SECONDS))) return false;
        cancelLocked(order, supplierOrders.findByOrderId(id), "Hết hạn thanh toán", "Tự hủy vì quá hạn thanh toán payOS", null);
        buyerNotifier.orderCancelled(order, "Đơn hàng đã quá hạn thanh toán nên được hủy tự động, hàng đã được hoàn lại kho.");
        return true;
    }
    private static final long EXPIRY_GRACE_SECONDS = 120;
    @org.springframework.beans.factory.annotation.Value("${app.payos.link-ttl-seconds:900}") private long linkTtlSeconds;
    private OrderView cancelLocked(MarketOrder order, List<SupplierOrder> parts, String providerReason, String note, UserAccount actor) {
        List<Payment> attempts = payments.findByOrderIdOrderByCreatedAtDesc(order.getId());
        if (attempts.stream().anyMatch(p -> "PAID".equals(p.getStatus())))
            throw BusinessException.conflict("PAYMENT_ALREADY_PAID", "Đơn hàng đã thanh toán nên không thể hủy");
        for (Payment payment : attempts.stream().filter(p -> "PENDING".equals(p.getStatus()) && p.getTxnRef() != null).toList()) {
            if (!"PAYOS".equals(payment.getProvider()))
                throw BusinessException.conflict("PAYMENT_IN_PROGRESS", "Thanh toán đang xử lý hoặc đã hoàn tất");
            PaymentProviderDto.StatusResult remote = payOSProvider.getPaymentStatus(payment);
            if (remote.orderCode() == null || !remote.orderCode().equals(payment.getProviderOrderCode()) ||
                    remote.amount() == null || BigDecimal.valueOf(remote.amount()).compareTo(payment.getAmount()) != 0)
                throw BusinessException.bad("PAYOS_STATUS_MISMATCH", "Dữ liệu payment payOS không khớp đơn hàng");
            if ("PAID".equals(remote.status()) || remote.amountPaid() != null && remote.amountPaid() > 0)
                throw BusinessException.conflict("PAYMENT_ALREADY_PAID", "payOS đã nhận tiền; vui lòng tải lại trạng thái đơn");
            if (List.of("CANCELLED", "EXPIRED", "FAILED").contains(remote.status())) {
                payment.setStatus("CANCELLED");
            } else {
                PaymentProviderDto.StatusResult cancelled = payOSProvider.cancelPayment(payment, providerReason);
                if (!"CANCELLED".equals(cancelled.status()))
                    throw BusinessException.conflict("PAYMENT_IN_PROGRESS", "payOS chưa xác nhận hủy liên kết thanh toán");
                payment.setStatus("CANCELLED");
            }
        }
        List<OrderItem> snapshots = parts.stream().flatMap(part -> orderItems.findBySupplierOrderId(part.getId()).stream()).toList();
        Map<Long, Product> locked = new HashMap<>();
        for (Long productId : snapshots.stream().map(item -> item.getProduct().getId()).distinct().sorted().toList())
            locked.put(productId, products.lockById(productId).orElseThrow(() -> BusinessException.missing("Sản phẩm")));
        for (OrderItem item : snapshots) {
            Product product = locked.get(item.getProduct().getId());
            product.setStock(product.getStock().add(item.getQuantity()));
        }
        parts.forEach(part -> part.setStatus("CANCELLED"));
        attempts.stream().filter(p -> "PENDING".equals(p.getStatus())).forEach(p -> p.setStatus("CANCELLED"));
        voucherService.release(order.getId());order.setStatus("CANCELLED"); history.record(order, "CANCELLED", actor, note);
        return view(order);
    }
    public OrderView view(MarketOrder order) {
        List<SupplierOrderView> parts = supplierOrders.findByOrderId(order.getId()).stream().map(part -> new SupplierOrderView(part.getId(), part.getSupplier().getId(), part.getSupplier().getName(), part.getStatus(), part.getSubtotal()==null?part.getTotalAmount():part.getSubtotal(),part.getDiscount()==null?BigDecimal.ZERO:part.getDiscount(),part.getTotalAmount(), orderItems.findBySupplierOrderId(part.getId()).stream().map(item -> new OrderItemView(item.getId(), item.getProduct().getId(), item.getProductNameSnapshot(), item.getUnitPrice(), item.getUnit(), item.getQuantity(), item.getTotalAmount())).toList())).toList();
        return new OrderView(order.getId(), order.getOrderCode(), order.getStatus(), order.getPaymentMethod(),order.getSubtotal(),order.getPartnerDiscount(),order.getPlatformDiscount(),order.getShippingFee(),order.getShippingDiscount(), order.getTotalAmount(),order.getShippingZone(), order.getFullName(), order.getPhone(), order.getAddress(), order.getNote(), order.getCreatedAt(), parts);
    }
}
