package com.app.features.orders.repository;

import com.app.features.orders.entity.SupplierOrder;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierOrderRepository extends JpaRepository<SupplierOrder, Long> { List<SupplierOrder> findByOrderId(Long orderId); List<SupplierOrder> findBySupplierIdOrderByCreatedAtDesc(Long supplierId); }
