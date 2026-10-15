package com.app.features.feedback.repository;

import com.app.features.feedback.entity.Complaint;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> { List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId); long countByUserId(Long userId); long countByStatus(String status); List<Complaint> findByStatusOrderByCreatedAtDesc(String status); boolean existsByOrderIdAndStatus(Long orderId, String status); }
