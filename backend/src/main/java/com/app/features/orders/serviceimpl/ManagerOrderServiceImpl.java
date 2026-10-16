package com.app.features.orders.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.orders.dto.ManagerOrderDto.*;
import com.app.features.orders.dto.OrderServiceDto;
import com.app.features.auth.entity.UserAccount;
import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.service.NotificationService;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.SupplierOrder;
import com.app.features.orders.repository.SupplierOrderRepository;
import com.app.features.orders.service.BuyerOrderNotifier;
import com.app.features.orders.service.OrderStatusHistoryService;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.repository.OrderStatusHistoryRepository;
import com.app.features.orders.service.ManagerOrderService;
import com.app.features.orders.service.OrderService;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.promotions.repository.OrderVoucherRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class ManagerOrderServiceImpl implements ManagerOrderService {
    private final OrderRepository orders; private final OrderService service; private final PaymentRepository payments;
    private final OrderVoucherRepository orderVouchers; private final OrderStatusHistoryRepository history; private final AuditService audit; private final CurrentUser current;
    private final SupplierOrderRepository supplierOrders; private final OrderStatusHistoryService statusHistory; private final BuyerOrderNotifier buyerNotifier; private final NotificationService notifications;
    public ManagerOrderServiceImpl(OrderRepository orders, OrderService service, PaymentRepository payments, OrderVoucherRepository orderVouchers,
            OrderStatusHistoryRepository history, AuditService audit, CurrentUser current,
            SupplierOrderRepository supplierOrders, OrderStatusHistoryService statusHistory, BuyerOrderNotifier buyerNotifier, NotificationService notifications) {
        this.supplierOrders = supplierOrders; this.statusHistory = statusHistory; this.buyerNotifier = buyerNotifier; this.notifications = notifications;
        this.orders = orders; this.service = service; this.payments = payments; this.orderVouchers = orderVouchers; this.history = history; this.audit = audit; this.current = current;
    }

    @Transactional(readOnly = true)
    public ApiResponse<PageResult<OrderServiceDto.OrderView>> list(String status, String paymentMethod, String q, LocalDate from, LocalDate to, Integer page, Integer size) {
        DateRange range = DateRange.of(from, to);
        Specification<MarketOrder> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (status != null && !status.isBlank()) where.add(cb.equal(root.get("status"), status.trim().toUpperCase(Locale.ROOT)));
            if (paymentMethod != null && !paymentMethod.isBlank()) where.add(cb.equal(root.get("paymentMethod"), paymentMethod.trim().toUpperCase(Locale.ROOT)));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                where.add(cb.or(cb.like(cb.lower(root.get("orderCode")), like), cb.like(cb.lower(root.get("fullName")), like),
                    cb.like(root.get("phone"), like), cb.like(cb.lower(root.join("user").get("email")), like)));
            }
            if (range.from() != null) where.add(cb.greaterThanOrEqualTo(root.get("createdAt"), range.from()));
            if (range.to() != null) where.add(cb.lessThan(root.get("createdAt"), range.to()));
            return cb.and(where.toArray(Predicate[]::new));
        };
        return ApiResponse.ok(PageResult.of(orders.findAll(spec, PageResult.request(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))), service::view));
    }

    @Transactional(readOnly = true)
    public ApiResponse<OrderDetail> detail(Long id) {
        MarketOrder order = orders.findById(id).orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        List<PaymentLine> paymentLines = payments.findByOrderIdOrderByCreatedAtDesc(id).stream()
            .map(p -> new PaymentLine(p.getId(), p.getProvider(), p.getStatus(), p.getAmount(), p.getProviderTransactionNo(), p.getCreatedAt(), p.getPaidAt())).toList();
        List<VoucherLine> voucherLines = orderVouchers.findByOrderId(id).stream()
            .map(v -> new VoucherLine(v.getCodeSnapshot(), v.getScopeSnapshot(), v.getDiscountTypeSnapshot(), v.getDiscountAmount(), v.getSupplierOrder() == null ? null : v.getSupplierOrder().getId())).toList();
        List<HistoryLine> historyLines = history.findByOrderIdOrderByCreatedAtAsc(id).stream()
            .map(h -> new HistoryLine(h.getStatus(), h.getActor() == null ? null : h.getActor().getEmail(), h.getNote(), h.getCreatedAt())).toList();
        return ApiResponse.ok(new OrderDetail(service.view(order), order.getUser().getId(), order.getUser().getEmail(), paymentLines, voucherLines, historyLines));
    }

    /**
     * Staff confirm that an order reached the customer, for every farm in it at once
     * (for example when a farm delivered but never updated its part). Online orders must already be paid;
     * for COD the money was collected on delivery, so its payment becomes PAID too. Customer and farms are told.
     */
    @Transactional
    public ApiResponse<OrderServiceDto.OrderView> confirmDelivered(Long id, String note) {
        MarketOrder order = orders.lockById(id).orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        if (List.of("DELIVERED", "CANCELLED").contains(order.getStatus())) throw BusinessException.conflict("ORDER_NOT_DELIVERABLE", "Đơn hàng đã giao xong hoặc đã hủy");
        if (!"COD".equals(order.getPaymentMethod()) && !payments.existsByOrderIdAndStatus(id, "PAID"))
            throw BusinessException.bad("PAYMENT_NOT_PAID", "Đơn thanh toán trực tuyến phải được thanh toán trước khi duyệt giao hàng");
        deliver(order, current.get(), reasonFor(note));
        return ApiResponse.ok(service.view(order));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<AwaitingDelivery>> awaitingDelivery() {
        return ApiResponse.ok(orders.findAwaitingDelivery().stream()
            .map(o -> new AwaitingDelivery(o.getId(), o.getOrderCode(), o.getStatus(), o.getPaymentMethod(), o.getTotalAmount(), o.getCreatedAt())).toList());
    }

    /** Confirms every COD or paid order still waiting, in one go; each one is handled exactly like a single confirmation. */
    @Transactional
    public ApiResponse<BulkDeliveredResult> confirmAllDelivered(String note) {
        UserAccount staff = current.get(); String reason = reasonFor(note); List<String> codes = new ArrayList<>();
        for (MarketOrder candidate : orders.findAwaitingDelivery()) {
            MarketOrder order = orders.lockById(candidate.getId()).orElseThrow();
            if (List.of("DELIVERED", "CANCELLED").contains(order.getStatus())) continue;
            deliver(order, staff, reason); codes.add(order.getOrderCode());
        }
        audit.record(staff, "ORDERS_DELIVERED_BULK", "MarketOrder", 0L, codes.size() + " đơn: " + String.join(", ", codes));
        return ApiResponse.ok(new BulkDeliveredResult(codes.size(), codes));
    }

    private static String reasonFor(String note) { return note == null || note.isBlank() ? "CleanMarket xác nhận giao hàng thành công" : note.trim(); }

    private void deliver(MarketOrder order, UserAccount staff, String reason) {
        Long id = order.getId();
        for (SupplierOrder part : supplierOrders.findByOrderId(id)) {
            if ("DELIVERED".equals(part.getStatus())) continue;
            part.setStatus("DELIVERED");
            audit.record(staff, "SUPPLIER_ORDER_DELIVERED_BY_STAFF", "SupplierOrder", part.getId(), reason);
            notifications.notify(part.getSupplier().getOwner(), NotificationType.ORDER, "Đơn " + order.getOrderCode() + " đã giao thành công",
                "CleanMarket đã xác nhận phần đơn của " + part.getSupplier().getName() + " được giao thành công cho khách hàng.", "/partner/orders");
        }
        // COD money is collected at the door, so a confirmed delivery also settles the payment.
        if ("COD".equals(order.getPaymentMethod()))
            payments.findByOrderIdOrderByCreatedAtDesc(id).stream().filter(p -> !"PAID".equals(p.getStatus())).findFirst().ifPresent(p -> {
                p.setStatus("PAID"); p.setPaidAt(java.time.Instant.now());
                audit.record(staff, "PAYMENT_COD_COLLECTED_BY_STAFF", "Payment", p.getId(), order.getOrderCode());
            });
        order.setStatus("DELIVERED");
        statusHistory.record(order, "DELIVERED", staff, reason);
        buyerNotifier.statusChanged(order, "DELIVERED");
        audit.record(staff, "ORDER_DELIVERED_BY_STAFF", "MarketOrder", id, reason);
    }

    @Transactional
    public ApiResponse<OrderServiceDto.OrderView> cancel(Long id, String reason) {
        OrderServiceDto.OrderView view = service.cancelByStaff(id, reason.trim());
        audit.record(current.get(), "ORDER_CANCEL_BY_STAFF", "MarketOrder", id, reason.trim());
        return ApiResponse.ok(view);
    }
}
