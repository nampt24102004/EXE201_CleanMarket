package com.app.features.admin.service;

import com.app.common.ApiResponse;
import com.app.common.PageResult;
import com.app.features.admin.dto.AdminControllerDto.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

public interface AdminService {
    ApiResponse<PageResult<UserView>> users(String q, String role, String status, Integer page, Integer size);
    ApiResponse<UserDetail> user(Long id);
    ApiResponse<UserView> createStaff(@Valid CreateStaffRequest request);
    ApiResponse<UserView> status(Long id, UserStatusRequest request);
    ApiResponse<UserView> role(Long id, @Valid RoleRequest request);
    ApiResponse<List<String>> roles();
    ApiResponse<List<CategoryView>> categories();
    ApiResponse<CategoryView> category(@Valid CategoryRequest request);
    ApiResponse<CategoryView> updateCategory(Long id, @Valid CategoryRequest request);
    ApiResponse<CategoryView> categoryStatus(Long id, UserStatusRequest request);
    ApiResponse<PageResult<AuditView>> audit(String actor, String action, String entityType, Long entityId, LocalDate from, LocalDate to, Integer page, Integer size);
    ApiResponse<List<SettingView>> settings();
    ApiResponse<SettingView> setting(String key, @Valid SettingRequest request);
}
