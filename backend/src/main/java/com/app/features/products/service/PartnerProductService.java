package com.app.features.products.service;

import com.app.common.*;
import com.app.features.products.dto.PartnerProductControllerDto.ProductRequest;
import com.app.features.products.dto.PartnerProductControllerDto.ProductView;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;

public interface PartnerProductService {
    public ApiResponse<List<ProductView>> mine();
    public ApiResponse<ProductView> create(@Valid ProductRequest request);
    public ApiResponse<ProductView> update(Long id, @Valid ProductRequest request);
}
