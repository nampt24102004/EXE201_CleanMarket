package com.app.features.suppliers.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.suppliers.enums.SupplierDocumentStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "supplier_documents")
@Getter @Setter
public class SupplierDocument extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    @Column(nullable = false, length = 60) private String type;
    @Column(nullable = false, length = 255) private String documentName;
    @Column(nullable = false, length = 255) private String originalFileName;
    @Column(length = 500, unique = true) private String objectKey;
    @Column(nullable = false, length = 1000) private String fileUrl;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24)
    private SupplierDocumentStatus status = SupplierDocumentStatus.PENDING;
    private LocalDate expiryDate;
    @Column(length = 1000) private String rejectionReason;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by") private UserAccount reviewedBy;
    private Instant reviewedAt;
    private Instant uploadedAt;

    /** Expiry is derived from the date, so no background job is needed to flip the status. */
    public boolean expiredOn(LocalDate day) { return status == SupplierDocumentStatus.EXPIRED || expiryDate != null && expiryDate.isBefore(day); }
    /** Status as users should see it today: a passed expiry date wins over PENDING/APPROVED. */
    public SupplierDocumentStatus effectiveStatus(LocalDate day) { return status != SupplierDocumentStatus.REJECTED && expiredOn(day) ? SupplierDocumentStatus.EXPIRED : status; }
}
