package com.app.features.feedback.repository;

import com.app.features.feedback.entity.Complaint;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Complaint> findByStatusOrderByCreatedAtDesc(String status);
    boolean existsByOrderIdAndStatus(Long orderId, String status);
    long countByUserId(Long userId);
    long countByStatus(String status);
    /** Complaints a supplier should see: aimed at its part, or about a whole order it supplied to. */
    @Query("""
        select c from Complaint c left join c.supplierOrder target left join target.supplier targetSupplier
        where targetSupplier.owner.id = :ownerId
           or (target is null and exists (select 1 from SupplierOrder so where so.order = c.order and so.supplier.owner.id = :ownerId))
        order by c.createdAt desc""")
    List<Complaint> findForSupplierOwner(@Param("ownerId") Long ownerId);
}
