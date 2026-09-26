package com.app.features.orders.entity;

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
@Table(name = "order_status_history")
@Getter @Setter
public class OrderStatusHistory extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private MarketOrder order;

    @Column(nullable = false, length = 24)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private UserAccount actor;

    @Column(length = 1000)
    private String note;
}