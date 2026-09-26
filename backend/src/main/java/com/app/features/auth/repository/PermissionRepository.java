package com.app.features.auth.repository;

import com.app.features.auth.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    java.util.Optional<Permission> findByCode(String code);
}