package com.app.features.auth.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter @Setter @EqualsAndHashCode
@NoArgsConstructor @AllArgsConstructor
public class UserRoleId implements Serializable {
    private Long userId;
    private Long roleId;
}