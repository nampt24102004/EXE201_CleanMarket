package com.app.features.user.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "addresses")
@Getter @Setter
public class Address extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 120)
    private String recipientName;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(nullable = false, length = 1000)
    private String addressLine;

    @Column(name = "is_default", nullable = false)
    private boolean defaultAddress;
}