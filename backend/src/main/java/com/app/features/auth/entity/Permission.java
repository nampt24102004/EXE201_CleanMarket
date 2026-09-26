package com.app.features.auth.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "permissions", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter @Setter
public class Permission extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String code;

    @Column(length = 500)
    private String description;
}