package com.app.features.feedback.entity;

import com.app.common.BaseEntity;
import com.app.features.feedback.enums.RefundStatus;
import com.app.features.payments.entity.Payment;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "refunds", uniqueConstraints = @UniqueConstraint(columnNames = "complaint_id"))
@Getter @Setter
public class Refund extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "complaint_id", nullable = false) private Complaint complaint;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "payment_id", nullable = false) private Payment payment;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal amount;
    @Column(nullable = false, length = 24) private String status = RefundStatus.REQUESTED.name();
    @Column(length = 1000) private String note;
    @Column(length = 120) private String providerRef;
    // Where the customer wants the money; collected after staff approve the refund amount.
    @Column(length = 120) private String bankName;
    @Column(length = 30) private String bankAccountNumber;
    @Column(length = 120) private String bankAccountHolder;
    private java.time.Instant bankSubmittedAt;
    /** Why staff sent the bank details back, shown to the customer. */
    @Column(length = 500) private String bankReviewNote;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by") private com.app.features.auth.entity.UserAccount reviewedBy;
    private java.time.Instant reviewedAt;
    private java.time.Instant completedAt;
}
