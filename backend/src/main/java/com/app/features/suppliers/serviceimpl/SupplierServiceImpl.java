package com.app.features.suppliers.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.suppliers.dto.SupplierControllerDto.ApplicationRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.DecisionRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.ProfileRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.SupplierView;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.app.features.suppliers.service.SupplierService;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly = true)
public class SupplierServiceImpl implements SupplierService {
    private final SupplierRepository suppliers; private final CurrentUser current; private final AuditService audit;
    public SupplierServiceImpl(SupplierRepository suppliers, CurrentUser current, AuditService audit) { this.suppliers = suppliers; this.current = current; this.audit = audit; }
    @Transactional public ApiResponse<SupplierView> apply(@Valid ApplicationRequest request) {
        UserAccount user = current.get(); if (suppliers.findByOwnerId(user.getId()).isPresent()) throw BusinessException.conflict("SUPPLIER_EXISTS", "Bạn đã có hồ sơ nhà cung cấp");
        Supplier supplier = new Supplier(); supplier.setOwner(user); supplier.setName(request.name().trim()); supplier.setLocation(request.location().trim()); supplier.setDescription(request.description()); supplier.setDocumentUrl(request.documentUrl()); suppliers.save(supplier);
        audit.record(user, "SUPPLIER_APPLY", "Supplier", supplier.getId(), null); return ApiResponse.ok(view(supplier));
    }
    public ApiResponse<SupplierView> mine() { UserAccount user = current.get(); return ApiResponse.ok(view(suppliers.findByOwnerId(user.getId()).orElseThrow(() -> BusinessException.missing("Hồ sơ nhà cung cấp")))); }
    @Transactional public ApiResponse<SupplierView> updateProfile(@Valid ProfileRequest request) {
        UserAccount user = current.get(); Supplier supplier = suppliers.findByOwnerId(user.getId()).orElseThrow(BusinessException::forbidden);
        if (!"APPROVED".equals(supplier.getStatus())) throw BusinessException.forbidden();
        supplier.setName(request.name().trim()); supplier.setLocation(request.location().trim()); supplier.setDescription(request.description());
        suppliers.save(supplier); audit.record(user, "SUPPLIER_PROFILE_UPDATE", "Supplier", supplier.getId(), null); return ApiResponse.ok(view(supplier));
    }
    public ApiResponse<List<SupplierView>> pending() { return ApiResponse.ok(suppliers.findByStatus("PENDING").stream().map(this::view).toList()); }
    @Transactional public ApiResponse<SupplierView> approve(Long id) { return ApiResponse.ok(decide(id, "APPROVED", null)); }
    @Transactional public ApiResponse<SupplierView> reject(Long id, DecisionRequest request) { return ApiResponse.ok(decide(id, "REJECTED", request == null ? null : request.reason())); }
    private SupplierView decide(Long id, String status, String reason) {
        UserAccount manager = current.get(); Supplier s = suppliers.findById(id).orElseThrow(() -> BusinessException.missing("Nhà cung cấp"));
        if (!"PENDING".equals(s.getStatus())) throw BusinessException.conflict("ALREADY_REVIEWED", "Hồ sơ đã được xử lý");
        s.setStatus(status); if ("APPROVED".equals(status)) s.getOwner().setRole("PARTNER"); suppliers.save(s);
        audit.record(manager, "SUPPLIER_" + status, "Supplier", s.getId(), reason); return view(s);
    }
    private SupplierView view(Supplier s) { return new SupplierView(s.getId(), s.getName(), s.getLocation(), s.getDescription(), s.getDocumentUrl(), s.getStatus(), s.getOwner().getId()); }
}
