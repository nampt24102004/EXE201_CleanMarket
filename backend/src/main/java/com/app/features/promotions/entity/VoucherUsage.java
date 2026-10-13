package com.app.features.promotions.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.orders.entity.MarketOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import com.app.features.promotions.enums.VoucherUsageStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
@Table(name = "voucher_usages", uniqueConstraints = @UniqueConstraint(columnNames = {"voucher_id", "order_id"}))
@Getter @Setter
public class VoucherUsage extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private MarketOrder order;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount;
    @Enumerated(EnumType.STRING) @Column(length=20) private VoucherUsageStatus status=VoucherUsageStatus.RESERVED;
}
