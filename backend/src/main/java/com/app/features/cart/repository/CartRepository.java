package com.app.features.cart.repository;

import com.app.features.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, Long> {
    java.util.Optional<Cart> findByUserId(Long userId);
}