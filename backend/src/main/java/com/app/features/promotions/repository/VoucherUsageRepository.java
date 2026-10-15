package com.app.features.promotions.repository;

import com.app.features.promotions.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {
    java.util.List<VoucherUsage> findByUserId(Long userId);
    long countByVoucherIdAndUserIdAndStatusIn(Long voucherId,Long userId,java.util.Collection<com.app.features.promotions.enums.VoucherUsageStatus> statuses);
    java.util.List<VoucherUsage> findByOrderId(Long orderId);
    boolean existsByVoucherId(Long voucherId);
    void deleteByVoucherId(Long voucherId);
}
