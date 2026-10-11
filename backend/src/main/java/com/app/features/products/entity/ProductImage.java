package com.app.features.products.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "product_images")
@Getter @Setter
public class ProductImage extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, length = 1000) private String imageUrl;
    @Column(length = 500, unique = true) private String objectKey;
    @Column(length = 255) private String originalFileName;
    @Column(nullable = false) private int sortOrder;
}
