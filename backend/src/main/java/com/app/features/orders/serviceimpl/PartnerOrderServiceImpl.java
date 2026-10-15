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
    private final SupplierRepository suppliers; private final SupplierOrderRepository parts; private final OrderItemRepository items; private final PaymentRepository payments; private final CurrentUser current; private final AuditService audit; private final OrderStatusHistoryService history;
    public PartnerOrderServiceImpl(SupplierRepository suppliers, SupplierOrderRepository parts, OrderItemRepository items, PaymentRepository payments, CurrentUser current, AuditService audit, OrderStatusHistoryService history) { this.suppliers = suppliers; this.parts = parts; this.items = items; this.payments = payments; this.current = current; this.audit = audit; this.history = history; }
    @Transactional(readOnly = true) public ApiResponse<List<PartView>> mine() { Supplier supplier = ownedSupplier(); return ApiResponse.ok(parts.findBySupplierIdOrderByCreatedAtDesc(supplier.getId()).stream().map(this::view).toList()); }
    @Transactional public ApiResponse<PartView> update(Long id, StatusRequest request) {
        Supplier supplier = ownedSupplier(); if (!"APPROVED".equals(supplier.getStatus())) throw BusinessException.bad("NOT_APPROVED_PARTNER", "Nhà cung cấp không ở trạng thái hoạt động");
        SupplierOrder part = parts.findById(id).orElseThrow(() -> BusinessException.missing("Phần đơn hàng")); if (!part.getSupplier().getId().equals(supplier.getId())) throw BusinessException.forbidden();
        List<String> states = List.of(SupplierOrderStatus.CREATED.name(), SupplierOrderStatus.CONFIRMED.name(), SupplierOrderStatus.SHIPPED.name(), SupplierOrderStatus.DELIVERED.name()); int previous = states.indexOf(part.getStatus()); int next = states.indexOf(request.status());
        if (previous < 0 || next != previous + 1) throw BusinessException.bad("INVALID_ORDER_STATUS", "Trạng thái đơn hàng phải chuyển theo đúng thứ tự");
        if ("PAYOS".equals(part.getOrder().getPaymentMethod()) && !payments.existsByOrderIdAndStatus(part.getOrder().getId(), "PAID")) throw BusinessException.bad("PAYMENT_PENDING", "Đơn thanh toán trực tuyến chưa được xác nhận");
        part.setStatus(request.status()); parts.save(part); MarketOrder order = part.getOrder();
        if (parts.findByOrderId(order.getId()).stream().allMatch(p -> "DELIVERED".equals(p.getStatus()))) {
            order.setStatus("DELIVERED"); history.record(order, "DELIVERED", current.get(), null);
            if ("COD".equals(order.getPaymentMethod())) payments.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream().findFirst().ifPresent(p -> { p.setStatus("PAID"); p.setPaidAt(java.time.Instant.now()); });
        } else if ("CREATED".equals(order.getStatus())) {
            order.setStatus("CONFIRMED"); history.record(order, "CONFIRMED", current.get(), "Nhà cung cấp đã xác nhận phần đơn");
        }
        audit.record(current.get(), "SUPPLIER_ORDER_" + request.status(), "SupplierOrder", id, null); return ApiResponse.ok(view(part));
    }
    private Supplier ownedSupplier() { return suppliers.findByOwnerId(current.get().getId()).orElseThrow(BusinessException::forbidden); }
    private PartView view(SupplierOrder p) { return new PartView(p.getId(), p.getOrder().getOrderCode(), p.getStatus(), p.getTotalAmount(), items.findBySupplierOrderId(p.getId()).stream().map(i -> new OrderServiceDto.OrderItemView(i.getId(), i.getProduct().getId(), i.getProductNameSnapshot(), i.getUnitPrice(), i.getUnit(), i.getQuantity(), i.getTotalAmount())).toList()); }
}
