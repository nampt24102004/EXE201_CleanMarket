package com.app.features.orders.repository;

import com.app.features.orders.entity.MarketOrder;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<MarketOrder, Long> { List<MarketOrder> findByUserIdOrderByCreatedAtDesc(Long userId); Optional<MarketOrder> findByOrderCode(String orderCode);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select o from MarketOrder o where o.id = :id") Optional<MarketOrder> lockById(@Param("id") Long id); }
