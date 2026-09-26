package com.app.features.auth.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "email_verification_otps", indexes = @Index(name = "idx_email_otp_user_created", columnList = "user_id,created_at"))
@Getter @Setter
public class EmailVerificationOtp extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private UserAccount user;
    @Column(nullable = false, length = 100) private String codeHash;
    @Column(nullable = false) private Instant expiresAt;
    @Column(nullable = false) private int failedAttempts;
    private Instant consumedAt;
}