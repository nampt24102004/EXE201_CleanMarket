package com.app.features.payments.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "payment_transactions", indexes = @Index(name = "idx_payment_transactions_provider_txn", columnList = "providerTransactionNo"))
@Getter @Setter
public class PaymentTransaction extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "payment_id", nullable = false) private Payment payment;
    @Column(nullable = false, length = 30) private String eventType;
    @Column(columnDefinition = "TEXT") private String requestPayload;
    @Column(columnDefinition = "TEXT") private String responsePayload;
    @Column(nullable = false) private boolean signatureValid;
    @Column(length = 10) private String responseCode;
    @Column(length = 100) private String providerTransactionNo;
}