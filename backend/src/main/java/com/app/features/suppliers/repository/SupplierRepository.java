package com.app.features.suppliers.repository;
import com.app.features.suppliers.entity.Supplier;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByOwnerId(Long ownerId);
    List<Supplier> findByStatus(String status);
    long countByStatus(String status);
    List<Supplier> findAllByOrderByCreatedAtDesc();
}
