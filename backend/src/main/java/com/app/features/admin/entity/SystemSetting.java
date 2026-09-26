package com.app.features.admin.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "system_settings", uniqueConstraints = @UniqueConstraint(columnNames = "setting_key"))
@Getter @Setter
public class SystemSetting extends BaseEntity {
    @Column(name = "setting_key", nullable = false, length = 120)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 4000)
    private String value;

    @Column(length = 500)
    private String description;
}