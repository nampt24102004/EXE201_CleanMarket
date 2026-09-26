package com.app.features.feedback.repository;

import com.app.features.feedback.entity.ComplaintEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintEvidenceRepository extends JpaRepository<ComplaintEvidence, Long> {
    java.util.List<ComplaintEvidence> findByComplaintId(Long complaintId);
}