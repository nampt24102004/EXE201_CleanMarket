package com.app.features.admin.dto;

import com.app.common.*;
import jakarta.validation.constraints.NotBlank;
import java.util.*;

public final class AdminControllerDto {
    private AdminControllerDto() { }
    public record UserView(Long id, String email, String fullName, String role, boolean enabled) { }
    public record UserStatusRequest(boolean enabled) { }
    public record RoleRequest(@NotBlank String role) { }
    public record CategoryRequest(@NotBlank String name) { }
    public record CategoryView(Long id, String name, boolean active) { }
    public record AuditView(Long id, String actorEmail, String action, String entityType, Long entityId, String detail, java.time.Instant createdAt) { }
}
