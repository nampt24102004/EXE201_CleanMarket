package com.app.features.auth.repository;

import com.app.features.auth.entity.UserRoleAssignment;
import com.app.features.auth.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, UserRoleId> {
}