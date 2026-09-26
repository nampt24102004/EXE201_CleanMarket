package com.app.features.payments.repository;

import com.app.features.payments.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    boolean existsByProviderTransactionNo(String providerTransactionNo);
}