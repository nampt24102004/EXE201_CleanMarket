package com.app.features.promotions.repository;

import com.app.features.promotions.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {
    java.util.List<VoucherUsage> findByUserId(Long userId);
}