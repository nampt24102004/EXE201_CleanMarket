package com.app.features.payments.repository;

import com.app.features.payments.entity.Payment;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Payment> {
    List<Payment> findByOrderIdOrderByCreatedAtDesc(Long orderId);
    boolean existsByOrderIdAndStatus(Long orderId, String status);
    Optional<Payment> findByTxnRef(String txnRef);
    Optional<Payment> findFirstByOrderIdAndProviderOrderByCreatedAtDesc(Long orderId, String provider);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Payment p where p.id = :id") Optional<Payment> lockById(@Param("id") Long id);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Payment p where p.txnRef = :txnRef") Optional<Payment> lockByTxnRef(@Param("txnRef") String txnRef);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Payment p where p.providerOrderCode = :providerOrderCode") Optional<Payment> lockByProviderOrderCode(@Param("providerOrderCode") Long providerOrderCode);
}