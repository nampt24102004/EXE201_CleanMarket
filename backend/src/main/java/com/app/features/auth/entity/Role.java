package com.app.features.auth.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "roles", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
@Getter @Setter
public class Role extends BaseEntity {
    @Column(nullable = false, length = 40)
    private String name;

    @Column(length = 500)
    private String description;
}