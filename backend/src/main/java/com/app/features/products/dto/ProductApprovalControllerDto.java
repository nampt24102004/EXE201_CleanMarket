package com.app.features.products.dto;

import com.app.common.*;
import java.util.*;

public final class ProductApprovalControllerDto {
    private ProductApprovalControllerDto() { }
    public record ReviewView(Long id, String name, String supplierName, String approvalStatus, String status, String certificateNo) { }
    public record RejectRequest(String reason) { }
}
