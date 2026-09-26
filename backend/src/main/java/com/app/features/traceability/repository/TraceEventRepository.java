package com.app.features.traceability.repository;

import com.app.features.traceability.entity.TraceEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TraceEventRepository extends JpaRepository<TraceEvent, Long> {
    java.util.List<TraceEvent> findByBatchIdOrderByEventTimeAsc(Long batchId);
}