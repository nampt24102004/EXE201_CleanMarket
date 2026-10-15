package com.app.features.admin.serviceimpl;

import com.app.common.*;
import com.app.features.admin.dto.AdminControllerDto.*;
import com.app.features.admin.entity.SystemSetting;
import com.app.features.admin.repository.SystemSettingRepository;
import com.app.features.admin.service.AdminService;
import com.app.features.audit.entity.AuditLog;
import com.app.features.audit.repository.AuditRepository;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.Role;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.entity.UserRoleAssignment;
import com.app.features.auth.enums.UserRole;
import com.app.features.auth.repository.RoleRepository;
import com.app.features.auth.repository.UserRepository;
import com.app.features.auth.repository.UserRoleAssignmentRepository;
import com.app.features.auth.security.AccountRoles;
import com.app.features.auth.security.CurrentUser;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.feedback.repository.ComplaintRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.suppliers.repository.SupplierRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class AdminServiceImpl implements AdminService {
    private static final Set<String> STAFF_ROLES = Set.of(UserRole.MANAGER.name(), UserRole.ADMIN.name());
    private final UserRepository users; private final CategoryRepository categories; private final AuditRepository logs; private final CurrentUser current; private final AuditService audit;
    private final RoleRepository roleRepository; private final UserRoleAssignmentRepository assignments; private final AccountRoles accountRoles; private final PasswordEncoder passwords;
    private final OrderRepository orders; private final ComplaintRepository complaints; private final SupplierRepository suppliers; private final SystemSettingRepository settings;

    public AdminServiceImpl(UserRepository users, CategoryRepository categories, AuditRepository logs, CurrentUser current, AuditService audit,
            RoleRepository roleRepository, UserRoleAssignmentRepository assignments, AccountRoles accountRoles, PasswordEncoder passwords,
            OrderRepository orders, ComplaintRepository complaints, SupplierRepository suppliers, SystemSettingRepository settings) {
        this.users = users; this.categories = categories; this.logs = logs; this.current = current; this.audit = audit;
        this.roleRepository = roleRepository; this.assignments = assignments; this.accountRoles = accountRoles; this.passwords = passwords;
        this.orders = orders; this.complaints = complaints; this.suppliers = suppliers; this.settings = settings;
    }

    @Transactional(readOnly = true)
    public ApiResponse<PageResult<UserView>> users(String q, String role, String status, Integer page, Integer size) {
        Specification<UserAccount> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                where.add(cb.or(cb.like(cb.lower(root.get("email")), like), cb.like(cb.lower(root.get("fullName")), like), cb.like(root.get("phone"), like)));
            }
            if (role != null && !role.isBlank()) where.add(cb.equal(root.get("role"), role.trim().toUpperCase(Locale.ROOT)));
            if (status != null && !status.isBlank()) switch (status.trim().toUpperCase(Locale.ROOT)) {
                case "ACTIVE" -> { where.add(cb.isTrue(root.get("enabled"))); where.add(cb.isFalse(root.get("locked"))); }
                case "LOCKED" -> where.add(cb.isTrue(root.get("locked")));
                case "UNVERIFIED" -> { where.add(cb.isFalse(root.get("enabled"))); where.add(cb.isFalse(root.get("locked"))); }
                default -> throw BusinessException.bad("INVALID_STATUS", "Trạng thái lọc phải là ACTIVE, LOCKED hoặc UNVERIFIED");
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
        return ApiResponse.ok(PageResult.of(users.findAll(spec, PageResult.request(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))), this::user));
    }

    @Transactional(readOnly = true)
    public ApiResponse<UserDetail> user(Long id) {
        UserAccount u = users.findById(id).orElseThrow(() -> BusinessException.missing("Tài khoản"));
        SupplierSummary supplier = suppliers.findByOwnerId(id).map(s -> new SupplierSummary(s.getId(), s.getName(), s.getStatus())).orElse(null);
        return ApiResponse.ok(new UserDetail(user(u), orders.countByUserId(id), orders.sumSpentByUser(id), complaints.countByUserId(id), supplier));
    }

    @Transactional
    public ApiResponse<UserView> createStaff(@Valid CreateStaffRequest request) {
        String role = request.role().trim().toUpperCase(Locale.ROOT);
        if (!STAFF_ROLES.contains(role)) throw BusinessException.bad("INVALID_ROLE", "Chỉ tạo được tài khoản MANAGER hoặc ADMIN");
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) throw BusinessException.conflict("EMAIL_EXISTS", "Email đã được sử dụng");
        UserAccount u = new UserAccount(); u.setEmail(email); u.setFullName(request.fullName().trim()); u.setPhone(blankToNull(request.phone()));
        u.setPasswordHash(passwords.encode(request.password())); u.setRole(role); u.setEnabled(true); users.save(u);
        assign(u, role);
        audit.record(current.get(), "STAFF_CREATE", "UserAccount", u.getId(), role);
        return ApiResponse.ok(user(u));
    }

    @Transactional public ApiResponse<UserView> status(Long id, UserStatusRequest request) {
        UserAccount target = target(id); target.setLocked(!request.enabled()); users.save(target);
        audit.record(current.get(), request.enabled() ? "USER_UNLOCK" : "USER_LOCK", "UserAccount", id, null);
        return ApiResponse.ok(user(target));
    }

    @Transactional public ApiResponse<UserView> role(Long id, @Valid RoleRequest request) {
        String role = request.role().trim().toUpperCase(Locale.ROOT);
        if (Arrays.stream(UserRole.values()).noneMatch(value -> value.name().equals(role))) throw BusinessException.bad("INVALID_ROLE", "Vai trò không hợp lệ");
        UserAccount target = target(id); String before = target.getRole(); target.setRole(role); users.save(target);
        // Staff roles also live in role assignments; drop the ones the admin is taking away so they stop granting access.
        List<UserRoleAssignment> revoked = assignments.findByUserId(id).stream()
            .filter(a -> STAFF_ROLES.contains(a.getRole().getName().toUpperCase(Locale.ROOT)) && !a.getRole().getName().equalsIgnoreCase(role)).toList();
        assignments.deleteAll(revoked);
        if (STAFF_ROLES.contains(role)) assign(target, role);
        audit.record(current.get(), "USER_ROLE_CHANGE", "UserAccount", id, before + " -> " + role);
        return ApiResponse.ok(user(target));
    }

    public ApiResponse<List<String>> roles() { return ApiResponse.ok(Arrays.stream(UserRole.values()).map(Enum::name).toList()); }
    public ApiResponse<List<CategoryView>> categories() { return ApiResponse.ok(categories.findAll().stream().map(this::category).toList()); }

    @Transactional public ApiResponse<CategoryView> category(@Valid CategoryRequest request) {
        if (categories.findByNameIgnoreCase(request.name().trim()).isPresent()) throw BusinessException.conflict("CATEGORY_EXISTS", "Danh mục đã tồn tại");
        Category category = new Category(); category.setName(request.name().trim()); categories.save(category); audit.record(current.get(), "CATEGORY_CREATE", "Category", category.getId(), category.getName()); return ApiResponse.ok(category(category));
    }

    @Transactional public ApiResponse<CategoryView> updateCategory(Long id, @Valid CategoryRequest request) {
        Category category = categories.findById(id).orElseThrow(() -> BusinessException.missing("Danh mục"));
        String name = request.name().trim();
        categories.findByNameIgnoreCase(name).filter(other -> !other.getId().equals(id))
            .ifPresent(other -> { throw BusinessException.conflict("CATEGORY_EXISTS", "Danh mục đã tồn tại"); });
        String before = category.getName(); category.setName(name); categories.save(category);
        audit.record(current.get(), "CATEGORY_UPDATE", "Category", id, before + " -> " + name);
        return ApiResponse.ok(category(category));
    }

    @Transactional public ApiResponse<CategoryView> categoryStatus(Long id, UserStatusRequest request) {
        Category category = categories.findById(id).orElseThrow(() -> BusinessException.missing("Danh mục")); category.setActive(request.enabled()); categories.save(category); audit.record(current.get(), "CATEGORY_STATUS", "Category", id, String.valueOf(request.enabled())); return ApiResponse.ok(category(category));
    }

    @Transactional(readOnly = true)
    public ApiResponse<PageResult<AuditView>> audit(String actor, String action, String entityType, Long entityId, LocalDate from, LocalDate to, Integer page, Integer size) {
        DateRange range = DateRange.of(from, to);
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (actor != null && !actor.isBlank()) where.add(cb.like(cb.lower(root.join("actor").get("email")), "%" + actor.trim().toLowerCase(Locale.ROOT) + "%"));
            if (action != null && !action.isBlank()) where.add(cb.like(root.get("action"), "%" + action.trim().toUpperCase(Locale.ROOT) + "%"));
            if (entityType != null && !entityType.isBlank()) where.add(cb.equal(root.get("entityType"), entityType.trim()));
            if (entityId != null) where.add(cb.equal(root.get("entityId"), entityId));
            if (range.from() != null) where.add(cb.greaterThanOrEqualTo(root.get("createdAt"), range.from()));
            if (range.to() != null) where.add(cb.lessThan(root.get("createdAt"), range.to()));
            return cb.and(where.toArray(Predicate[]::new));
        };
        return ApiResponse.ok(PageResult.of(logs.findAll(spec, PageResult.request(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))),
            log -> new AuditView(log.getId(), log.getActor() == null ? null : log.getActor().getEmail(), log.getAction(), log.getEntityType(), log.getEntityId(), log.getDetail(), log.getCreatedAt())));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<SettingView>> settings() {
        return ApiResponse.ok(settings.findAll(Sort.by("key")).stream().map(this::setting).toList());
    }

    @Transactional
    public ApiResponse<SettingView> setting(String key, @Valid SettingRequest request) {
        if (key == null || !key.matches("[a-z0-9][a-z0-9._-]{1,119}")) throw BusinessException.bad("INVALID_SETTING_KEY", "Khóa cấu hình chỉ gồm chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới");
        SystemSetting s = settings.findByKey(key).orElseGet(() -> { SystemSetting created = new SystemSetting(); created.setKey(key); return created; });
        String before = s.getValue(); s.setValue(request.value()); if (request.description() != null) s.setDescription(request.description()); settings.save(s);
        audit.record(current.get(), "SETTING_UPDATE", "SystemSetting", s.getId(), key + ": " + (before == null ? "(mới)" : before) + " -> " + request.value());
        return ApiResponse.ok(setting(s));
    }

    private void assign(UserAccount user, String roleName) {
        Role role = roleRepository.findByNameIgnoreCase(roleName).orElseGet(() -> { Role r = new Role(); r.setName(roleName); return roleRepository.save(r); });
        if (!assignments.existsByUserIdAndRoleId(user.getId(), role.getId())) { UserRoleAssignment a = new UserRoleAssignment(); a.setUser(user); a.setRole(role); assignments.save(a); }
    }
    private UserAccount target(Long id) { UserAccount target = users.findById(id).orElseThrow(() -> BusinessException.missing("Tài khoản")); if (target.getId().equals(current.get().getId())) throw BusinessException.bad("SELF_CHANGE", "Không thể thay đổi tài khoản đang đăng nhập"); return target; }
    private UserView user(UserAccount u) { return new UserView(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole(), accountRoles.of(u), !u.isLocked(), u.isEnabled(), u.isLocked(), u.getCreatedAt()); }
    private CategoryView category(Category c) { return new CategoryView(c.getId(), c.getName(), c.isActive()); }
    private SettingView setting(SystemSetting s) { return new SettingView(s.getKey(), s.getValue(), s.getDescription(), s.getUpdatedAt()); }
    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
