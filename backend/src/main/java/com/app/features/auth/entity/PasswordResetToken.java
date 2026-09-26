package com.app.features.auth.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "password_reset_tokens", uniqueConstraints = @UniqueConstraint(columnNames = "tokenHash"), indexes = @Index(name = "idx_password_reset_user_created", columnList = "user_id,created_at"))
@Getter @Setter
public class PasswordResetToken extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private UserAccount user;
    @Column(nullable = false, length = 64) private String tokenHash;
    @Column(nullable = false) private Instant expiresAt;
    private Instant usedAt;
}