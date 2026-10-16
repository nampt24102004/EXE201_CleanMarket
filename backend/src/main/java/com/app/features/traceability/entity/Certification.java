package com.app.features.traceability.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.products.entity.Product;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.traceability.enums.CertificationStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "certifications")
@Getter @Setter
public class Certification extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "supplier_id") private Supplier supplier;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id") private Product product;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "batch_id") private ProductBatch batch;
    @Column(nullable = false, length = 80) private String type;
    @Column(nullable = false, length = 120) private String certificateNo;
    private LocalDate issuedAt;
    private LocalDate expiryAt;
    @Column(length = 160) private String issuer;
    @Column(length = 500, unique = true) private String objectKey;
    @Column(length = 1000) private String fileUrl;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24)
    private CertificationStatus status = CertificationStatus.PENDING;
    @Column(length = 1000) private String rejectionReason;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by") private UserAccount reviewedBy;
    private Instant reviewedAt;
    public boolean expiredOn(LocalDate day) { return status == CertificationStatus.EXPIRED || expiryAt != null && expiryAt.isBefore(day); }
    public CertificationStatus effectiveStatus(LocalDate day) { return status != CertificationStatus.REJECTED && expiredOn(day) ? CertificationStatus.EXPIRED : status; }
    @PrePersist @PreUpdate private void validateTarget() {
        int targets = (supplier == null ? 0 : 1) + (product == null ? 0 : 1) + (batch == null ? 0 : 1);
        if (targets != 1) throw new IllegalStateException("A certification must target exactly one supplier, product or batch");
    }
}
