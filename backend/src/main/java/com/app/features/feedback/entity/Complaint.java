package com.app.features.feedback.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.feedback.enums.ComplaintStatus;
import com.app.features.orders.entity.MarketOrder;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "complaints")
@Getter @Setter
public class Complaint extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private UserAccount user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false) private MarketOrder order;
    @Column(nullable = false, length = 120) private String reason;
    @Column(nullable = false, length = 2000) private String description;
    @Column(nullable = false, length = 24) private String status = ComplaintStatus.PENDING.name();
    @Column(length = 2000) private String resolution;
}
