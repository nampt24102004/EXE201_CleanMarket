package com.app.features.suppliers.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.suppliers.enums.SupplierStatus;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "suppliers")
@Getter @Setter
public class Supplier extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private UserAccount owner;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private String location;
    @Column(nullable = false, length = 190) private String email;
    @Column(nullable = false, length = 30) private String phone;
    @Column(nullable = false, length = 40) private String supplierType;
    @Column(length = 2000) private String description;
    @Column(nullable = false, length = 24) private String status = SupplierStatus.PENDING.name();
    @Column(length = 500) private String documentUrl;
    @Column(length = 1000) private String rejectionReason;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by") private UserAccount reviewedBy;
    private Instant reviewedAt;
    @PrePersist @PreUpdate private void defaults() {
        if (email == null || email.isBlank()) email = owner.getEmail();
        if (phone == null || phone.isBlank()) phone = owner.getPhone() == null ? "Chưa cập nhật" : owner.getPhone();
        if (supplierType == null || supplierType.isBlank()) supplierType = "OTHER";
    }
}
