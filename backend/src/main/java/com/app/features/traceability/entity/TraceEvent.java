package com.app.features.traceability.entity;
import com.app.features.traceability.enums.TraceEventType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "trace_events")
@Getter @Setter
public class TraceEvent extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TraceEventType eventType;

    @Column(nullable = false)
    private Instant eventTime;

    @Column(length = 200)
    private String location;

    @Column(length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private UserAccount actor;
}