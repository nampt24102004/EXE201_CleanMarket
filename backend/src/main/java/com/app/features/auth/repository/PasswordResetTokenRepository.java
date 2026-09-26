package com.app.features.auth.repository;

import com.app.features.auth.entity.PasswordResetToken;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    List<PasswordResetToken> findByUserIdAndUsedAtIsNull(Long userId);
}