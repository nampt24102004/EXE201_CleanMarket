package com.app.features.orders.repository;

import com.app.features.orders.entity.OrderItem;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> { List<OrderItem> findBySupplierOrderId(Long supplierOrderId); List<OrderItem> findBySupplierOrderOrderId(Long orderId); }
