package com.app.features.suppliers.entity;
import com.app.features.suppliers.enums.SupplierDocumentStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import com.app.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "supplier_documents")
@Getter @Setter
public class SupplierDocument extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(nullable = false, length = 60)
    private String type;

    @Column(nullable = false, length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private SupplierDocumentStatus status = SupplierDocumentStatus.PENDING;

    private LocalDate expiryDate;
}