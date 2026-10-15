package com.app.features.auth.security;

import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRoleAssignmentRepository;
import java.util.*;
import org.springframework.stereotype.Component;

/** Single source for the roles a user currently holds: role assignments plus the users.role column. */
@Component
public class AccountRoles {
    private final UserRoleAssignmentRepository assignments;
    public AccountRoles(UserRoleAssignmentRepository assignments) { this.assignments = assignments; }
    public List<String> of(UserAccount user) {
        LinkedHashSet<String> roles = new LinkedHashSet<>();
        assignments.findByUserId(user.getId()).forEach(a -> roles.add(a.getRole().getName().toUpperCase()));
        roles.add(user.getRole().toUpperCase());
        return List.copyOf(roles);
    }
    public static boolean active(UserAccount user) { return user.isEnabled() && !user.isLocked(); }
}
