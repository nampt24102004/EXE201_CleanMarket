package com.app.features.orders.repository;

import com.app.features.orders.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {
    java.util.List<OrderStatusHistory> findByOrderIdOrderByCreatedAtAsc(Long orderId);
}