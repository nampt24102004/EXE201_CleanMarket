package com.app.features.orders.serviceimpl;
import com.app.features.orders.service.OrderStatusHistoryService;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.orders.dto.OrderServiceDto;
import com.app.features.orders.dto.PartnerOrderControllerDto.PartView;
import com.app.features.orders.dto.PartnerOrderControllerDto.StatusRequest;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.SupplierOrder;
import com.app.features.orders.enums.SupplierOrderStatus;
import com.app.features.orders.repository.OrderItemRepository;
import com.app.features.orders.repository.SupplierOrderRepository;
import com.app.features.orders.service.PartnerOrderService;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class PartnerOrderServiceImpl implements PartnerOrderService {
    private final SupplierRepository suppliers; private final SupplierOrderRepository parts; private final OrderItemRepository items; private final PaymentRepository payments; private final CurrentUser current; private final AuditService audit; private final OrderStatusHistoryService history; private final com.app.features.orders.service.BuyerOrderNotifier buyerNotifier;
    public PartnerOrderServiceImpl(SupplierRepository suppliers, SupplierOrderRepository parts, OrderItemRepository items, PaymentRepository payments, CurrentUser current, AuditService audit, OrderStatusHistoryService history, com.app.features.orders.service.BuyerOrderNotifier buyerNotifier) { this.suppliers = suppliers; this.parts = parts; this.items = items; this.payments = payments; this.current = current; this.audit = audit; this.history = history; this.buyerNotifier = buyerNotifier; }
    // payOS orders the customer never paid (still waiting, or abandoned and cancelled) are noise for the supplier, so they are hidden unless asked for.
    @Transactional(readOnly = true) public ApiResponse<List<PartView>> mine(boolean includeUnpaid) { Supplier supplier = ownedSupplier(); return ApiResponse.ok(parts.findBySupplierIdOrderByCreatedAtDesc(supplier.getId()).stream().filter(p -> includeUnpaid || !unpaidOnline(p)).map(this::view).toList()); }
    private boolean unpaidOnline(SupplierOrder p) { return "PAYOS".equals(p.getOrder().getPaymentMethod()) && !payments.existsByOrderIdAndStatus(p.getOrder().getId(), "PAID") && !payments.existsByOrderIdAndStatus(p.getOrder().getId(), "REFUNDED"); }
    @Transactional public ApiResponse<PartView> update(Long id, StatusRequest request) {
        // A suspended supplier takes no new orders (its products are hidden) but must still be able to finish the ones it accepted.
        Supplier supplier = ownedSupplier(); if (!List.of("APPROVED", "SUSPENDED").contains(supplier.getStatus())) throw BusinessException.bad("NOT_APPROVED_PARTNER", "Nhà cung cấp không ở trạng thái hoạt động");
        SupplierOrder part = parts.findById(id).orElseThrow(() -> BusinessException.missing("Phần đơn hàng")); if (!part.getSupplier().getId().equals(supplier.getId())) throw BusinessException.forbidden();
        List<String> states = List.of(SupplierOrderStatus.CREATED.name(), SupplierOrderStatus.CONFIRMED.name(), SupplierOrderStatus.SHIPPED.name(), SupplierOrderStatus.DELIVERED.name()); int previous = states.indexOf(part.getStatus()); int next = states.indexOf(request.status());
        if (previous < 0 || next != previous + 1) throw BusinessException.bad("INVALID_ORDER_STATUS", "Trạng thái đơn hàng phải chuyển theo đúng thứ tự");
        if ("PAYOS".equals(part.getOrder().getPaymentMethod()) && !payments.existsByOrderIdAndStatus(part.getOrder().getId(), "PAID")) throw BusinessException.bad("PAYMENT_PENDING", "Đơn thanh toán trực tuyến chưa được xác nhận");
        part.setStatus(request.status()); parts.save(part); MarketOrder order = part.getOrder();
        // The customer's order follows its slowest-moving signals: delivered once every part is, shipping once any part left the farm.
        List<SupplierOrder> all = parts.findByOrderId(order.getId());
        if (all.stream().allMatch(p -> "DELIVERED".equals(p.getStatus()))) {
            order.setStatus("DELIVERED"); history.record(order, "DELIVERED", current.get(), null); buyerNotifier.statusChanged(order, "DELIVERED");
            if ("COD".equals(order.getPaymentMethod())) payments.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream().findFirst().ifPresent(p -> { p.setStatus("PAID"); p.setPaidAt(java.time.Instant.now()); });
        } else if (all.stream().anyMatch(p -> List.of("SHIPPED", "DELIVERED").contains(p.getStatus())) && !"SHIPPED".equals(order.getStatus())) {
            order.setStatus("SHIPPED"); history.record(order, "SHIPPED", current.get(), "Nhà cung cấp " + supplier.getName() + " đã giao hàng cho vận chuyển"); buyerNotifier.statusChanged(order, "SHIPPED");
        } else if ("CREATED".equals(order.getStatus())) {
            order.setStatus("CONFIRMED"); history.record(order, "CONFIRMED", current.get(), "Nhà cung cấp đã xác nhận phần đơn"); buyerNotifier.statusChanged(order, "CONFIRMED");
        }
        audit.record(current.get(), "SUPPLIER_ORDER_" + request.status(), "SupplierOrder", id, null); return ApiResponse.ok(view(part));
    }
    private Supplier ownedSupplier() { return suppliers.findByOwnerId(current.get().getId()).orElseThrow(BusinessException::forbidden); }
    private PartView view(SupplierOrder p) { MarketOrder o = p.getOrder(); String paymentStatus = payments.findByOrderIdOrderByCreatedAtDesc(o.getId()).stream().findFirst().map(x -> x.getStatus()).orElse(null);
        return new PartView(p.getId(), o.getOrderCode(), p.getStatus(), p.getTotalAmount(), items.findBySupplierOrderId(p.getId()).stream().map(i -> new OrderServiceDto.OrderItemView(i.getId(), i.getProduct().getId(), i.getProductNameSnapshot(), i.getUnitPrice(), i.getUnit(), i.getQuantity(), i.getTotalAmount())).toList(),
            o.getStatus(), o.getPaymentMethod(), paymentStatus, o.getFullName(), o.getPhone(), o.getAddress(), o.getNote(), p.getCreatedAt()); }
}
