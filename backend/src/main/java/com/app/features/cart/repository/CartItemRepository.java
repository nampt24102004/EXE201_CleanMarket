package com.app.features.cart.repository;

import com.app.features.cart.entity.CartItem;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> { List<CartItem> findByUserId(Long userId); Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId); void deleteByUserId(Long userId); }
