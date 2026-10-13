package com.app.features.promotions.entity;
import com.app.features.promotions.enums.VoucherDiscountType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.app.features.promotions.enums.VoucherScope;
import com.app.features.promotions.enums.VoucherStatus;
import com.app.features.auth.entity.UserAccount;
import com.app.features.suppliers.entity.Supplier;

import com.app.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "vouchers", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter @Setter
public class Voucher extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String code;

    @Column(length = 160)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VoucherDiscountType discountType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal discountValue;

    @Enumerated(EnumType.STRING) @Column(length=20) private VoucherScope scope=VoucherScope.PLATFORM;
    @Column(precision=15,scale=2) private BigDecimal maximumDiscountAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal minimumOrderAmount;

    private Integer usageLimit;
    private Integer perCustomerLimit = 1;

    @Column(nullable = false)
    private int usedCount;

    private Instant startsAt;
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean active = true;
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean newCustomerOnly;
    @Enumerated(EnumType.STRING) @Column(length=20) private VoucherStatus status=VoucherStatus.DRAFT;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="supplier_id") private Supplier supplier;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by") private UserAccount createdBy;
}
