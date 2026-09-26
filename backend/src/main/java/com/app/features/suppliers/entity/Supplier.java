package com.app.features.suppliers.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.suppliers.enums.SupplierStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "suppliers")
@Getter @Setter
public class Supplier extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private UserAccount owner;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private String location;
    @Column(length = 2000) private String description;
    @Column(nullable = false, length = 24) private String status = SupplierStatus.PENDING.name();
    @Column(length = 500) private String documentUrl;
}
