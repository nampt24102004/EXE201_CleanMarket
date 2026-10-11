package com.app.features.suppliers.service;

import com.app.common.ApiResponse;
import com.app.features.suppliers.dto.SupplierControllerDto.*;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface SupplierService {
    ApiResponse<SupplierView> apply(ApplicationRequest request);
    ApiResponse<SupplierView> mine();
    ApiResponse<SupplierView> updateApplication(ProfileRequest request);
    ApiResponse<SupplierView> updateProfile(ProfileRequest request);
    ApiResponse<DocumentView> uploadDocument(String type, String documentName, MultipartFile file);
    ApiResponse<DocumentView> uploadPartnerDocument(String type, String documentName, MultipartFile file);
    ApiResponse<SupplierView> resubmit();
    ApiResponse<List<SupplierView>> list(String status);
    ApiResponse<SupplierView> detail(Long id);
    ApiResponse<SupplierView> approve(Long id);
    ApiResponse<SupplierView> reject(Long id, DecisionRequest request);
    ApiResponse<SupplierView> approveDocument(Long supplierId, Long documentId);
    ApiResponse<SupplierView> rejectDocument(Long supplierId, Long documentId, DecisionRequest request);
}
