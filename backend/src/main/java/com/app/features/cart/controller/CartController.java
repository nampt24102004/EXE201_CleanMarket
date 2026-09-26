package com.app.features.cart.controller;

import com.app.common.*;
import com.app.features.cart.dto.CartControllerDto.CartView;
import com.app.features.cart.dto.CartControllerDto.ItemRequest;
import com.app.features.cart.dto.CartControllerDto.QuantityRequest;
import com.app.features.cart.service.CartService;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/cart") @Transactional(readOnly = true) @PreAuthorize("hasRole('USER')")
public class CartController {
    private final CartService service;
    public CartController(CartService service) { this.service = service; }
    @GetMapping
    public ApiResponse<List<CartView>> get() { return service.get(); }
    @PostMapping("/items") @Transactional
    public ApiResponse<CartView> add(@Valid @RequestBody ItemRequest request) { return service.add(request); }
    @PutMapping("/items/{id}") @Transactional
    public ApiResponse<CartView> update(@PathVariable Long id, @Valid @RequestBody QuantityRequest request) { return service.update(id, request); }
    @DeleteMapping("/items/{id}") @Transactional
    public ApiResponse<Void> delete(@PathVariable Long id) { return service.delete(id); }
}
