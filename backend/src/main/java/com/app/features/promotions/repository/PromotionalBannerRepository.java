package com.app.features.promotions.repository;

import com.app.features.promotions.entity.PromotionalBanner;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PromotionalBannerRepository extends JpaRepository<PromotionalBanner, Long> {

    List<PromotionalBanner> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();

    List<PromotionalBanner> findByPositionAndIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc(String position);

    List<PromotionalBanner> findAllByOrderByDisplayOrderAscCreatedAtDesc();

    List<PromotionalBanner> findByPositionOrderByDisplayOrderAscCreatedAtDesc(String position);
}
