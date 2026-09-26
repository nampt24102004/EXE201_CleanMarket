package com.app.features.admin.controller;

import com.app.common.*;
import com.app.features.admin.dto.AdminControllerDto.AuditView;
import com.app.features.admin.dto.AdminControllerDto.CategoryRequest;
import com.app.features.admin.dto.AdminControllerDto.CategoryView;
import com.app.features.admin.dto.AdminControllerDto.RoleRequest;
import com.app.features.admin.dto.AdminControllerDto.UserStatusRequest;
import com.app.features.admin.dto.AdminControllerDto.UserView;
import com.app.features.admin.service.AdminService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service = service; }
    @GetMapping("/users")
    public ApiResponse<List<UserView>> users() { return service.users(); }
    @PutMapping("/users/{id}/status") @Transactional
    public ApiResponse<UserView> status(@PathVariable Long id, @RequestBody UserStatusRequest request) { return service.status(id, request); }
    @PutMapping("/users/{id}/role") @Transactional
    public ApiResponse<UserView> role(@PathVariable Long id, @Valid @RequestBody RoleRequest request) { return service.role(id, request); }
    @GetMapping("/roles")
    public ApiResponse<List<String>> roles() { return service.roles(); }
    @GetMapping("/categories")
    public ApiResponse<List<CategoryView>> categories() { return service.categories(); }
    @PostMapping("/categories") @Transactional
    public ApiResponse<CategoryView> category(@Valid @RequestBody CategoryRequest request) { return service.category(request); }
    @PutMapping("/categories/{id}/status") @Transactional
    public ApiResponse<CategoryView> categoryStatus(@PathVariable Long id, @RequestBody UserStatusRequest request) { return service.categoryStatus(id, request); }
    @GetMapping("/audit-logs") @Transactional(readOnly = true)
    public ApiResponse<List<AuditView>> audit() { return service.audit(); }
}
