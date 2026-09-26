package com.app.features.admin.serviceimpl;

import com.app.common.*;
import com.app.features.admin.dto.AdminControllerDto.AuditView;
import com.app.features.admin.dto.AdminControllerDto.CategoryRequest;
import com.app.features.admin.dto.AdminControllerDto.CategoryView;
import com.app.features.admin.dto.AdminControllerDto.RoleRequest;
import com.app.features.admin.dto.AdminControllerDto.UserStatusRequest;
import com.app.features.admin.dto.AdminControllerDto.UserView;
import com.app.features.admin.service.AdminService;
import com.app.features.audit.entity.AuditLog;
import com.app.features.audit.repository.AuditRepository;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.enums.UserRole;
import com.app.features.auth.repository.UserRepository;
import com.app.features.auth.security.CurrentUser;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class AdminServiceImpl implements AdminService {
    private final UserRepository users; private final CategoryRepository categories; private final AuditRepository logs; private final CurrentUser current; private final AuditService audit;
    public AdminServiceImpl(UserRepository users, CategoryRepository categories, AuditRepository logs, CurrentUser current, AuditService audit) { this.users = users; this.categories = categories; this.logs = logs; this.current = current; this.audit = audit; }
    public ApiResponse<List<UserView>> users() { return ApiResponse.ok(users.findAll().stream().map(this::user).toList()); }
    @Transactional public ApiResponse<UserView> status(Long id, UserStatusRequest request) {
        UserAccount target = target(id); target.setEnabled(request.enabled()); users.save(target); audit.record(current.get(), request.enabled() ? "USER_ENABLE" : "USER_DISABLE", "UserAccount", id, null); return ApiResponse.ok(user(target));
    }
    @Transactional public ApiResponse<UserView> role(Long id, @Valid RoleRequest request) {
        if (Arrays.stream(UserRole.values()).noneMatch(value -> value.name().equals(request.role()))) throw BusinessException.bad("INVALID_ROLE", "Vai trò không hợp lệ");
        UserAccount target = target(id); String before = target.getRole(); target.setRole(request.role()); users.save(target); audit.record(current.get(), "USER_ROLE_CHANGE", "UserAccount", id, before + " -> " + request.role()); return ApiResponse.ok(user(target));
    }
    public ApiResponse<List<String>> roles() { return ApiResponse.ok(Arrays.stream(UserRole.values()).map(Enum::name).toList()); }
    public ApiResponse<List<CategoryView>> categories() { return ApiResponse.ok(categories.findAll().stream().map(this::category).toList()); }
    @Transactional public ApiResponse<CategoryView> category(@Valid CategoryRequest request) {
        if (categories.findByNameIgnoreCase(request.name().trim()).isPresent()) throw BusinessException.conflict("CATEGORY_EXISTS", "Danh mục đã tồn tại");
        Category category = new Category(); category.setName(request.name().trim()); categories.save(category); audit.record(current.get(), "CATEGORY_CREATE", "Category", category.getId(), category.getName()); return ApiResponse.ok(category(category));
    }
    @Transactional public ApiResponse<CategoryView> categoryStatus(Long id, UserStatusRequest request) {
        Category category = categories.findById(id).orElseThrow(() -> BusinessException.missing("Danh mục")); category.setActive(request.enabled()); categories.save(category); audit.record(current.get(), "CATEGORY_STATUS", "Category", id, String.valueOf(request.enabled())); return ApiResponse.ok(category(category));
    }
    @Transactional(readOnly = true) public ApiResponse<List<AuditView>> audit() { return ApiResponse.ok(logs.findAll().stream().sorted(Comparator.comparing(AuditLog::getCreatedAt).reversed()).limit(200).map(log -> new AuditView(log.getId(), log.getActor() == null ? null : log.getActor().getEmail(), log.getAction(), log.getEntityType(), log.getEntityId(), log.getDetail(), log.getCreatedAt())).toList()); }
    private UserAccount target(Long id) { UserAccount target = users.findById(id).orElseThrow(() -> BusinessException.missing("Tài khoản")); if (target.getId().equals(current.get().getId())) throw BusinessException.bad("SELF_CHANGE", "Không thể thay đổi tài khoản đang đăng nhập"); return target; }
    private UserView user(UserAccount u) { return new UserView(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isEnabled()); }
    private CategoryView category(Category c) { return new CategoryView(c.getId(), c.getName(), c.isActive()); }
}
