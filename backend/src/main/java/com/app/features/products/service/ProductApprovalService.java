package com.app.features.products.service;

import com.app.common.ApiResponse;
import com.app.features.products.dto.ProductApprovalControllerDto.*;
import java.util.List;

public interface ProductApprovalService {
    ApiResponse<List<ReviewView>> list(String status);
    ApiResponse<ReviewView> detail(Long id);
    ApiResponse<ReviewView> approve(Long id);
    ApiResponse<ReviewView> reject(Long id,RejectRequest request);
    ApiResponse<ReviewView> approveCertificate(Long productId,Long certificateId);
    ApiResponse<ReviewView> rejectCertificate(Long productId,Long certificateId,RejectRequest request);
}
