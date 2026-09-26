package com.app.features.products.repository;

import com.app.features.products.entity.Product;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("select p from Product p join fetch p.supplier s join fetch p.category c where p.approvalStatus = 'APPROVED' and p.status = 'ACTIVE' and s.status = 'APPROVED'")
    List<Product> findPublic();
    List<Product> findBySupplierId(Long supplierId);
    List<Product> findByApprovalStatus(String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Product p where p.id = :id") Optional<Product> lockById(@Param("id") Long id);
}
