package com.app.features.payments.entity;

import com.app.common.BaseEntity;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.payments.enums.PaymentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "payments", uniqueConstraints = {
    @UniqueConstraint(name = "uk_payments_txn_ref", columnNames = "txnRef"),
    @UniqueConstraint(name = "uk_payments_provider_order_code", columnNames = "providerOrderCode")
})
@Getter @Setter
public class Payment extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false) private MarketOrder order;
    @Column(nullable = false, length = 16) private String provider;
    @Column(nullable = false, length = 24) private String status = PaymentStatus.PENDING.name();
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal amount;
    @Column(length = 100) private String txnRef;
    @Column(length = 100) private String providerTransactionNo;
    private Long providerOrderCode;
    @Column(length = 100) private String providerPaymentLinkId;
    @Column(length = 1000) private String checkoutUrl;
    @Column(columnDefinition = "TEXT") private String qrCode;
    private Instant expiresAt;
    @Column(length = 10) private String responseCode;
    private Instant paidAt;
}