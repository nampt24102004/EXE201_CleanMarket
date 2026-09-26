package com.app.features.auth.repository;

import com.app.features.auth.entity.RolePermissionAssignment;
import com.app.features.auth.entity.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionAssignmentRepository extends JpaRepository<RolePermissionAssignment, RolePermissionId> {
}