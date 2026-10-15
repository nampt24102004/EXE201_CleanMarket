package com.app.features.admin.controller;

import com.app.common.*;
import com.app.features.admin.dto.AdminControllerDto.PaymentView;
import com.app.features.admin.serviceimpl.AdminReportServiceImpl;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.payments.dto.PayOSPaymentDto.StatusResponse;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.payments.service.PayOSPaymentService;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin/payments")
public class AdminPaymentController {
    private final PaymentRepository payments; private final PayOSPaymentService payOS; private final AuditService audit; private final CurrentUser current;
    public AdminPaymentController(PaymentRepository payments, PayOSPaymentService payOS, AuditService audit, CurrentUser current) {
        this.payments = payments; this.payOS = payOS; this.audit = audit; this.current = current;
    }

    /** stale=true narrows to payOS payments still PENDING after the reconcile threshold. */
    @GetMapping @Transactional(readOnly = true)
    public ApiResponse<PageResult<PaymentView>> list(@RequestParam(required = false) String status, @RequestParam(required = false) String provider,
            @RequestParam(required = false) String q, @RequestParam(required = false) Boolean stale,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
        DateRange range = DateRange.of(from, to);
        Instant staleBefore = Instant.now().minus(AdminReportServiceImpl.STALE_PAYMENT_AFTER);
        Specification<Payment> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (status != null && !status.isBlank()) where.add(cb.equal(root.get("status"), status.trim().toUpperCase(Locale.ROOT)));
            if (provider != null && !provider.isBlank()) where.add(cb.equal(root.get("provider"), provider.trim().toUpperCase(Locale.ROOT)));
            if (q != null && !q.isBlank()) where.add(cb.like(cb.lower(root.join("order").get("orderCode")), "%" + q.trim().toLowerCase(Locale.ROOT) + "%"));
            if (Boolean.TRUE.equals(stale)) { where.add(cb.equal(root.get("status"), "PENDING")); where.add(cb.equal(root.get("provider"), "PAYOS")); where.add(cb.lessThan(root.get("createdAt"), staleBefore)); }
            if (range.from() != null) where.add(cb.greaterThanOrEqualTo(root.get("createdAt"), range.from()));
            if (range.to() != null) where.add(cb.lessThan(root.get("createdAt"), range.to()));
            return cb.and(where.toArray(Predicate[]::new));
        };
        return ApiResponse.ok(PageResult.of(payments.findAll(spec, PageResult.request(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))), p -> new PaymentView(
            p.getId(), p.getOrder().getId(), p.getOrder().getOrderCode(), p.getOrder().getUser().getEmail(), p.getProvider(), p.getStatus(), p.getAmount(),
            p.getProviderTransactionNo(), p.getCreatedAt(), p.getPaidAt(), p.getExpiresAt(),
            "PENDING".equals(p.getStatus()) && "PAYOS".equals(p.getProvider()) && p.getCreatedAt() != null && p.getCreatedAt().isBefore(staleBefore))));
    }

    @PostMapping("/{id}/reconcile")
    public ApiResponse<StatusResponse> reconcile(@PathVariable Long id) {
        StatusResponse result = payOS.reconcile(id);
        audit.record(current.get(), "PAYMENT_RECONCILE", "Payment", id, result.paymentStatus());
        return ApiResponse.ok(result);
    }
}
