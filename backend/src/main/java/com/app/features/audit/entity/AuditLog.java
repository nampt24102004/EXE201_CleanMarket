package com.app.features.audit.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "audit_logs")
@Getter @Setter
public class AuditLog extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "actor_user_id") private UserAccount actor;
    @Column(nullable = false, length = 120) private String action;
    @Column(nullable = false, length = 80) private String entityType;
    @Column(nullable = false) private Long entityId;
    @Column(length = 2000) private String detail;
    @Column(columnDefinition = "TEXT") private String oldValue;
    @Column(columnDefinition = "TEXT") private String newValue;
}
