package com.app.features.admin.serviceimpl;

import com.app.common.BusinessException;
import com.app.common.DateRange;
import com.app.features.admin.dto.AdminControllerDto.*;
import com.app.features.admin.service.AdminReportService;
import com.app.features.auth.repository.UserRepository;
import com.app.features.feedback.repository.ComplaintRepository;
import com.app.features.feedback.repository.RefundRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.products.repository.ProductRepository;
import com.app.features.suppliers.repository.SupplierRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Revenue counts money actually collected: payments that reached PAID (including ones later refunded),
 * minus manually completed refunds. GMV is the value of every order that was not cancelled.
 */
@Service
@Transactional(readOnly = true)
public class AdminReportServiceImpl implements AdminReportService {
    /** A payOS link older than this and still PENDING is worth a manual reconcile. */
    public static final Duration STALE_PAYMENT_AFTER = Duration.ofMinutes(30);
    private static final List<String> COLLECTED = List.of("PAID", "REFUNDED");
    private static final int MAX_RANGE_DAYS = 366;

    private final EntityManager em; private final OrderRepository orders; private final UserRepository users; private final SupplierRepository suppliers;
    private final ProductRepository products; private final ComplaintRepository complaints; private final RefundRepository refunds;

    public AdminReportServiceImpl(EntityManager em, OrderRepository orders, UserRepository users, SupplierRepository suppliers,
            ProductRepository products, ComplaintRepository complaints, RefundRepository refunds) {
        this.em = em; this.orders = orders; this.users = users; this.suppliers = suppliers; this.products = products; this.complaints = complaints; this.refunds = refunds;
    }

    public DashboardSummary summary() {
        BigDecimal paid = em.createQuery("select coalesce(sum(p.amount), 0) from Payment p where p.status in :statuses", BigDecimal.class)
            .setParameter("statuses", COLLECTED).getSingleResult();
        BigDecimal refunded = em.createQuery("select coalesce(sum(r.amount), 0) from Refund r where r.status = 'MANUAL_COMPLETED'", BigDecimal.class).getSingleResult();
        BigDecimal gmv = em.createQuery("select coalesce(sum(o.totalAmount), 0) from MarketOrder o where o.status <> 'CANCELLED'", BigDecimal.class).getSingleResult();
        Map<String, Long> byStatus = new TreeMap<>();
        for (Object[] row : orders.countByStatus()) byStatus.put((String) row[0], (Long) row[1]);
        long stale = em.createQuery("select count(p) from Payment p where p.status = 'PENDING' and p.provider = 'PAYOS' and p.createdAt < :before", Long.class)
            .setParameter("before", Instant.now().minus(STALE_PAYMENT_AFTER)).getSingleResult();
        return new DashboardSummary(paid, refunded, paid.subtract(refunded), gmv, byStatus,
            users.count(), users.countByCreatedAtAfter(Instant.now().minus(30, ChronoUnit.DAYS)), users.countByLockedTrue(),
            suppliers.countByStatus("PENDING"), products.countByApprovalStatus("PENDING"), complaints.countByStatus("PENDING"), refunds.countByStatus("REQUESTED"), stale);
    }

    public List<RevenuePoint> revenue(LocalDate from, LocalDate to, String groupBy) {
        LocalDate end = to == null ? LocalDate.now(DateRange.ZONE) : to;
        LocalDate start = from == null ? end.minusDays(29) : from;
        DateRange range = bounded(start, end);
        boolean monthly = "month".equalsIgnoreCase(groupBy);
        if (!monthly && groupBy != null && !groupBy.isBlank() && !"day".equalsIgnoreCase(groupBy)) throw BusinessException.bad("INVALID_GROUP_BY", "groupBy phải là day hoặc month");
        List<Object[]> rows = em.createQuery("select p.paidAt, p.amount from Payment p where p.status in :statuses and p.paidAt >= :from and p.paidAt < :to", Object[].class)
            .setParameter("statuses", COLLECTED).setParameter("from", range.from()).setParameter("to", range.to()).getResultList();
        // Pre-fill every bucket so the chart shows zero days instead of gaps.
        TreeMap<LocalDate, BigDecimal[]> buckets = new TreeMap<>();
        for (LocalDate d = bucket(start, monthly); !d.isAfter(end); d = monthly ? d.plusMonths(1) : d.plusDays(1)) buckets.put(d, new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
        for (Object[] row : rows) {
            LocalDate day = ((Instant) row[0]).atZone(DateRange.ZONE).toLocalDate();
            BigDecimal[] slot = buckets.computeIfAbsent(bucket(day, monthly), k -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
            slot[0] = slot[0].add((BigDecimal) row[1]); slot[1] = slot[1].add(BigDecimal.ONE);
        }
        return buckets.entrySet().stream().map(e -> new RevenuePoint(e.getKey(), e.getValue()[0], e.getValue()[1].longValue())).toList();
    }

    public List<TopProduct> topProducts(LocalDate from, LocalDate to, Integer limit) {
        DateRange range = bounded(from, to);
        TypedQuery<Object[]> query = em.createQuery("""
            select p.id, p.name, s.name, sum(oi.quantity), sum(oi.totalAmount), count(distinct o.id)
            from OrderItem oi join oi.product p join oi.supplierOrder so join so.supplier s join so.order o
            where o.status <> 'CANCELLED' and so.status <> 'CANCELLED'
              and (:from is null or o.createdAt >= :from) and (:to is null or o.createdAt < :to)
            group by p.id, p.name, s.name order by sum(oi.totalAmount) desc""", Object[].class);
        return withRange(query, range).setMaxResults(limit(limit)).getResultList().stream()
            .map(r -> new TopProduct((Long) r[0], (String) r[1], (String) r[2], (BigDecimal) r[3], (BigDecimal) r[4], (Long) r[5])).toList();
    }

    public List<TopSupplier> topSuppliers(LocalDate from, LocalDate to, Integer limit) {
        DateRange range = bounded(from, to);
        TypedQuery<Object[]> query = em.createQuery("""
            select s.id, s.name, sum(so.totalAmount), count(so)
            from SupplierOrder so join so.supplier s join so.order o
            where so.status <> 'CANCELLED' and (:from is null or o.createdAt >= :from) and (:to is null or o.createdAt < :to)
            group by s.id, s.name order by sum(so.totalAmount) desc""", Object[].class);
        return withRange(query, range).setMaxResults(limit(limit)).getResultList().stream()
            .map(r -> new TopSupplier((Long) r[0], (String) r[1], (BigDecimal) r[2], (Long) r[3])).toList();
    }

    private static DateRange bounded(LocalDate from, LocalDate to) {
        if (from != null && to != null && ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) throw BusinessException.bad("RANGE_TOO_LARGE", "Khoảng thời gian tối đa là 1 năm");
        return DateRange.of(from, to);
    }
    private static TypedQuery<Object[]> withRange(TypedQuery<Object[]> query, DateRange range) { return query.setParameter("from", range.from()).setParameter("to", range.to()); }
    private static LocalDate bucket(LocalDate day, boolean monthly) { return monthly ? day.withDayOfMonth(1) : day; }
    private static int limit(Integer limit) { return limit == null || limit <= 0 ? 10 : Math.min(limit, 50); }
}
