package com.app.features.orders.repository;

import com.app.features.orders.entity.MarketOrder;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<MarketOrder, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<MarketOrder> { List<MarketOrder> findByUserIdOrderByCreatedAtDesc(Long userId); Optional<MarketOrder> findByOrderCode(String orderCode);
    long countByUserId(Long userId);
    @Query("select o.id from MarketOrder o where o.status = 'PENDING_PAYMENT' and o.paymentMethod = 'PAYOS' and o.createdAt < :before") List<Long> findUnpaidPayOSCreatedBefore(@Param("before") java.time.Instant before);
    @Query("select coalesce(sum(o.totalAmount), 0) from MarketOrder o where o.user.id = :userId and o.status <> 'CANCELLED'") java.math.BigDecimal sumSpentByUser(@Param("userId") Long userId);
    /** Paid orders that have not reached the customer yet, oldest first. */
    @Query("select o from MarketOrder o where o.status not in ('DELIVERED', 'CANCELLED') and exists (select p.id from Payment p where p.order = o and p.status = 'PAID') order by o.createdAt")
    List<MarketOrder> findPaidAwaitingDelivery();
    @Query("select o.status, count(o) from MarketOrder o group by o.status") List<Object[]> countByStatus();
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select o from MarketOrder o where o.id = :id") Optional<MarketOrder> lockById(@Param("id") Long id); }
