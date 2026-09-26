package com.app.features.catalog.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "categories", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
@Getter @Setter
public class Category extends BaseEntity {
    @Column(nullable = false, length = 120) private String name;
    @Column(length = 160, unique = true) private String slug;
    @Column(nullable = false) private boolean active = true;
}
