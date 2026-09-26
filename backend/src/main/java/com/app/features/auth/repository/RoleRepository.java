package com.app.features.auth.repository;

import com.app.features.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    java.util.Optional<Role> findByNameIgnoreCase(String name);
}