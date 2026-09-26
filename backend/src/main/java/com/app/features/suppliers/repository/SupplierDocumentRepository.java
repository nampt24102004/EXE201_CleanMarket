package com.app.features.suppliers.repository;

import com.app.features.suppliers.entity.SupplierDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierDocumentRepository extends JpaRepository<SupplierDocument, Long> {
    java.util.List<SupplierDocument> findBySupplierId(Long supplierId);
}