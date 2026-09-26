package com.app.common;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@MappedSuperclass
@Getter @Setter
public abstract class BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    private Instant updatedAt;
    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}
