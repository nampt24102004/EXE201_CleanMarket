package com.app.features.products.service;

import com.app.common.*;
import com.app.features.products.dto.ProductApprovalControllerDto.RejectRequest;
import com.app.features.products.dto.ProductApprovalControllerDto.ReviewView;
import java.util.*;

public interface ProductApprovalService {
    public ApiResponse<List<ReviewView>> pending();
    public ApiResponse<ReviewView> approve(Long id);
    public ApiResponse<ReviewView> reject(Long id, RejectRequest request);
}
