package com.app.features.admin.service;

import com.app.common.*;
import com.app.features.admin.dto.AdminControllerDto.AuditView;
import com.app.features.admin.dto.AdminControllerDto.CategoryRequest;
import com.app.features.admin.dto.AdminControllerDto.CategoryView;
import com.app.features.admin.dto.AdminControllerDto.RoleRequest;
import com.app.features.admin.dto.AdminControllerDto.UserStatusRequest;
import com.app.features.admin.dto.AdminControllerDto.UserView;
import jakarta.validation.Valid;
import java.util.*;

public interface AdminService {
    public ApiResponse<List<UserView>> users();
    public ApiResponse<UserView> status(Long id, UserStatusRequest request);
    public ApiResponse<UserView> role(Long id, @Valid RoleRequest request);
    public ApiResponse<List<String>> roles();
    public ApiResponse<List<CategoryView>> categories();
    public ApiResponse<CategoryView> category(@Valid CategoryRequest request);
    public ApiResponse<CategoryView> categoryStatus(Long id, UserStatusRequest request);
    public ApiResponse<List<AuditView>> audit();
}
