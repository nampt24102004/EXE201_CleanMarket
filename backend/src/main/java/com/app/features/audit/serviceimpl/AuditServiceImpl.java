package com.app.features.audit.serviceimpl;

import com.app.features.audit.entity.AuditLog;
import com.app.features.audit.repository.AuditRepository;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.UserAccount;
import org.springframework.stereotype.Service;

@Service
public class AuditServiceImpl implements AuditService {
    private final AuditRepository logs;
    public AuditServiceImpl(AuditRepository logs) { this.logs = logs; }
    public void record(UserAccount actor, String action, String entityType, Long entityId, String detail) {
        AuditLog log = new AuditLog(); log.setActor(actor); log.setAction(action); log.setEntityType(entityType); log.setEntityId(entityId); log.setDetail(detail); logs.save(log);
    }
}
