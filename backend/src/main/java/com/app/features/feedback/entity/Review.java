package com.app.features.feedback.entity;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.products.entity.Product;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.orders.entity.OrderItem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "reviews", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "order_item_id"}))
@Getter @Setter
public class Review extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id") private Product product;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "supplier_id") private Supplier supplier;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private UserAccount user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_item_id", nullable = false) private OrderItem orderItem;
    @Column(nullable = false) private int rating;
    @Column(nullable = false, length = 2000) private String comment;
}
