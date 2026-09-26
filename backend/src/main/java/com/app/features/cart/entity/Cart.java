package com.app.features.cart.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "carts", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
@Getter @Setter
public class Cart extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;
}