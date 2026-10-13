package com.app.features.promotions.repository;

import com.app.features.promotions.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    java.util.Optional<Voucher> findByCodeIgnoreCase(String code);
    List<Voucher> findByScopeOrderByCreatedAtDesc(com.app.features.promotions.enums.VoucherScope scope);
    List<Voucher> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select v from Voucher v where v.id=:id") java.util.Optional<Voucher> lockById(@Param("id") Long id);
}
