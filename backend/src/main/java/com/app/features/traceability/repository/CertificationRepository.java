package com.app.features.traceability.repository;
import com.app.features.traceability.entity.Certification;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CertificationRepository extends JpaRepository<Certification, Long> {
    java.util.List<Certification> findByProductIdOrderByCreatedAtAsc(Long productId);
}
