package com.app.features.audit.repository;

import com.app.features.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditRepository extends JpaRepository<AuditLog, Long> { }
