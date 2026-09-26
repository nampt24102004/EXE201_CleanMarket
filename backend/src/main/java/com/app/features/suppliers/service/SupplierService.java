package com.app.features.suppliers.service;

import com.app.common.*;
import com.app.features.suppliers.dto.SupplierControllerDto.ApplicationRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.DecisionRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.ProfileRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.SupplierView;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.List;

public interface SupplierService {
    public ApiResponse<SupplierView> apply(@Valid ApplicationRequest request);
    public ApiResponse<SupplierView> mine();
    public ApiResponse<SupplierView> updateProfile(@Valid ProfileRequest request);
    public ApiResponse<List<SupplierView>> pending();
    public ApiResponse<SupplierView> approve(Long id);
    public ApiResponse<SupplierView> reject(Long id, DecisionRequest request);
}
