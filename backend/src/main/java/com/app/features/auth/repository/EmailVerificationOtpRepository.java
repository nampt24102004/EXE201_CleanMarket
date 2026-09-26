package com.app.features.auth.repository;

import com.app.features.auth.entity.EmailVerificationOtp;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, Long> {
    Optional<EmailVerificationOtp> findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(Long userId);
    List<EmailVerificationOtp> findByUserIdAndConsumedAtIsNull(Long userId);
}