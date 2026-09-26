package com.app.features.auth.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.enums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Getter @Setter
public class UserAccount extends BaseEntity {
    @Column(nullable = false, length = 190) private String email;
    @Column(nullable = false) private String passwordHash;
    @Column(nullable = false) private String fullName;
    @Column(length = 30) private String phone;
    @Column(nullable = false, length = 20) private String role = UserRole.USER.name();
    @Column(nullable = false) private boolean enabled = true;
}
