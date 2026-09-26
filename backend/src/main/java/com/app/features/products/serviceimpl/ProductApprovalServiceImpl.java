package com.app.features.products.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.products.dto.ProductApprovalControllerDto.RejectRequest;
import com.app.features.products.dto.ProductApprovalControllerDto.ReviewView;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.products.service.ProductApprovalService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class ProductApprovalServiceImpl implements ProductApprovalService {
    private final ProductRepository products; private final CurrentUser current; private final AuditService audit;
    public ProductApprovalServiceImpl(ProductRepository products, CurrentUser current, AuditService audit) { this.products = products; this.current = current; this.audit = audit; }
    @Transactional(readOnly = true) public ApiResponse<List<ReviewView>> pending() { return ApiResponse.ok(products.findByApprovalStatus("PENDING_APPROVAL").stream().map(this::view).toList()); }
    @Transactional public ApiResponse<ReviewView> approve(Long id) { return ApiResponse.ok(decide(id, true, null)); }
    @Transactional public ApiResponse<ReviewView> reject(Long id, RejectRequest request) { return ApiResponse.ok(decide(id, false, request == null ? null : request.reason())); }
    private ReviewView decide(Long id, boolean approved, String reason) {
        Product p = products.findById(id).orElseThrow(() -> BusinessException.missing("Sản phẩm"));
        if (!"PENDING_APPROVAL".equals(p.getApprovalStatus())) throw BusinessException.conflict("ALREADY_REVIEWED", "Sản phẩm đã được xử lý");
        if (approved && !"APPROVED".equals(p.getSupplier().getStatus())) throw BusinessException.bad("SUPPLIER_NOT_APPROVED", "Nhà cung cấp chưa được duyệt");
        p.setApprovalStatus(approved ? "APPROVED" : "REJECTED"); p.setStatus(approved ? "ACTIVE" : "INACTIVE"); products.save(p);
        audit.record(current.get(), approved ? "PRODUCT_APPROVE" : "PRODUCT_REJECT", "Product", id, reason); return view(p);
    }
    private ReviewView view(Product p) { return new ReviewView(p.getId(), p.getName(), p.getSupplier().getName(), p.getApprovalStatus(), p.getStatus(), p.getCertificateNo()); }
}
