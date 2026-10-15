package com.app.features.feedback.repository;

import com.app.features.feedback.entity.Review;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> { boolean existsByUserIdAndOrderItemId(Long userId, Long orderItemId); List<Review> findByOrderItemProductId(Long productId);
    /** [productId, average rating, review count] for every reviewed product. */
    @org.springframework.data.jpa.repository.Query("select r.orderItem.product.id, avg(r.rating), count(r) from Review r group by r.orderItem.product.id") List<Object[]> ratingSummary(); }
