package com.app.features.auth.repository;
import com.app.features.auth.entity.UserRoleAssignment;
import com.app.features.auth.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, UserRoleId> {
    @EntityGraph(attributePaths = "role")
    java.util.List<UserRoleAssignment> findByUserId(Long userId);
    boolean existsByUserIdAndRoleId(Long userId, Long roleId);
}
