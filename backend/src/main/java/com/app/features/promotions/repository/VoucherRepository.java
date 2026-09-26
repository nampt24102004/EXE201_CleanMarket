package com.app.features.promotions.repository;

import com.app.features.promotions.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    java.util.Optional<Voucher> findByCodeIgnoreCase(String code);
}