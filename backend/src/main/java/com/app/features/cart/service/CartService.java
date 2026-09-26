package com.app.features.cart.service;

import com.app.common.*;
import com.app.features.cart.dto.CartControllerDto.CartView;
import com.app.features.cart.dto.CartControllerDto.ItemRequest;
import com.app.features.cart.dto.CartControllerDto.QuantityRequest;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;

public interface CartService {
    public ApiResponse<List<CartView>> get();
    public ApiResponse<CartView> add(@Valid ItemRequest request);
    public ApiResponse<CartView> update(Long id, @Valid QuantityRequest request);
    public ApiResponse<Void> delete(Long id);
}
