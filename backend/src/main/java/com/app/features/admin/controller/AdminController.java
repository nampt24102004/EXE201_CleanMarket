package com.app.features.admin.controller;

import com.app.common.*;
import com.app.features.admin.dto.AdminControllerDto.*;
import com.app.features.admin.service.AdminService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service = service; }

    @GetMapping("/users")
    public ApiResponse<PageResult<UserView>> users(@RequestParam(required = false) String q, @RequestParam(required = false) String role,
            @RequestParam(required = false) String status, @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
        return service.users(q, role, status, page, size);
    }
    @GetMapping("/users/{id}") public ApiResponse<UserDetail> user(@PathVariable Long id) { return service.user(id); }
    @PostMapping("/users") public ApiResponse<UserView> createStaff(@Valid @RequestBody CreateStaffRequest request) { return service.createStaff(request); }
    @PutMapping("/users/{id}/status") public ApiResponse<UserView> status(@PathVariable Long id, @RequestBody UserStatusRequest request) { return service.status(id, request); }
    @PutMapping("/users/{id}/role") public ApiResponse<UserView> role(@PathVariable Long id, @Valid @RequestBody RoleRequest request) { return service.role(id, request); }
    @GetMapping("/roles") public ApiResponse<List<String>> roles() { return service.roles(); }

    @GetMapping("/categories") public ApiResponse<List<CategoryView>> categories() { return service.categories(); }
    @PostMapping("/categories") public ApiResponse<CategoryView> category(@Valid @RequestBody CategoryRequest request) { return service.category(request); }
    @PutMapping("/categories/{id}") public ApiResponse<CategoryView> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) { return service.updateCategory(id, request); }
    @PutMapping("/categories/{id}/status") public ApiResponse<CategoryView> categoryStatus(@PathVariable Long id, @RequestBody UserStatusRequest request) { return service.categoryStatus(id, request); }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResult<AuditView>> audit(@RequestParam(required = false) String actor, @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType, @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
        return service.audit(actor, action, entityType, entityId, from, to, page, size);
    }

    @GetMapping("/settings") public ApiResponse<List<SettingView>> settings() { return service.settings(); }
    @PutMapping("/settings/{key}") public ApiResponse<SettingView> setting(@PathVariable String key, @Valid @RequestBody SettingRequest request) { return service.setting(key, request); }
}
