package com.app.features.cart.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.products.entity.Product;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id"}))
@Getter @Setter
public class CartItem extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "cart_id") private Cart cart;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private UserAccount user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false) private Product product;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal quantity;
}
