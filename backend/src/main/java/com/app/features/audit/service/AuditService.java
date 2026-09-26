package com.app.features.audit.service;

import com.app.features.auth.entity.UserAccount;

public interface AuditService {
    void record(UserAccount actor, String action, String entityType, Long entityId, String detail);
}
