package com.app.features.orders.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.orders.dto.ManagerOrderDto.*;
import com.app.features.orders.dto.OrderServiceDto;
import com.app.features.orders.entity.MarketOrder;
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
    public ManagerOrderServiceImpl(OrderRepository orders, OrderService service, PaymentRepository payments, OrderVoucherRepository orderVouchers,
            OrderStatusHistoryRepository history, AuditService audit, CurrentUser current) {
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

    @Transactional
    public ApiResponse<OrderServiceDto.OrderView> cancel(Long id, String reason) {
        OrderServiceDto.OrderView view = service.cancelByStaff(id, reason.trim());
        audit.record(current.get(), "ORDER_CANCEL_BY_STAFF", "MarketOrder", id, reason.trim());
        return ApiResponse.ok(view);
    }
}
