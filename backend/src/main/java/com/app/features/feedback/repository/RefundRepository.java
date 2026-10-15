package com.app.features.feedback.repository;

import com.app.features.feedback.entity.Refund;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefundRepository extends JpaRepository<Refund, Long> { List<Refund> findByStatus(String status); List<Refund> findByPaymentId(Long paymentId); boolean existsByComplaintId(Long complaintId); long countByStatus(String status); }
