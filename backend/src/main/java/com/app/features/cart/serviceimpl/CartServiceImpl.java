package com.app.features.cart.serviceimpl;
import com.app.features.cart.repository.CartRepository;
import com.app.features.cart.entity.Cart;

import com.app.common.*;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.cart.dto.CartControllerDto.CartView;
import com.app.features.cart.dto.CartControllerDto.ItemRequest;
import com.app.features.cart.dto.CartControllerDto.QuantityRequest;
import com.app.features.cart.entity.CartItem;
import com.app.features.cart.repository.CartItemRepository;
import com.app.features.cart.service.CartService;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly = true) public class CartServiceImpl implements CartService {
    private final CartItemRepository cart; private final CartRepository carts; private final ProductRepository products; private final CurrentUser current;
    public CartServiceImpl(CartItemRepository cart, CartRepository carts, ProductRepository products, CurrentUser current) { this.cart = cart; this.carts = carts; this.products = products; this.current = current; }
    public ApiResponse<List<CartView>> get() { return ApiResponse.ok(cart.findByUserId(current.get().getId()).stream().map(this::view).toList()); }
    @Transactional public ApiResponse<CartView> add(@Valid ItemRequest request) {
        UserAccount user = current.get(); Product product = saleable(request.productId());
        Cart basket = carts.findByUserId(user.getId()).orElseGet(() -> { Cart created = new Cart(); created.setUser(user); return carts.save(created); });
        CartItem item = cart.findByUserIdAndProductId(user.getId(), product.getId()).orElseGet(() -> { CartItem fresh = new CartItem(); fresh.setUser(user); fresh.setProduct(product); fresh.setQuantity(BigDecimal.ZERO); return fresh; });
        item.setCart(basket);
        BigDecimal next = item.getQuantity().add(request.quantity()); if (next.compareTo(product.getStock()) > 0) throw BusinessException.bad("PRODUCT_OUT_OF_STOCK", "Sản phẩm không đủ tồn kho");
        item.setQuantity(next); return ApiResponse.ok(view(cart.save(item)));
    }
    @Transactional public ApiResponse<CartView> update(Long id, @Valid QuantityRequest request) {
        CartItem item = owned(id); Product product = saleable(item.getProduct().getId()); if (request.quantity().compareTo(product.getStock()) > 0) throw BusinessException.bad("PRODUCT_OUT_OF_STOCK", "Sản phẩm không đủ tồn kho");
        item.setQuantity(request.quantity()); return ApiResponse.ok(view(cart.save(item)));
    }
    @Transactional public ApiResponse<Void> delete(Long id) { cart.delete(owned(id)); return ApiResponse.ok(null); }
    private CartItem owned(Long id) { CartItem item = cart.findById(id).orElseThrow(() -> BusinessException.missing("Mục giỏ hàng")); if (!item.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden(); return item; }
    private Product saleable(Long id) { Product p = products.findById(id).orElseThrow(() -> BusinessException.missing("Sản phẩm")); if (!"ACTIVE".equals(p.getStatus()) || !"APPROVED".equals(p.getApprovalStatus()) || !"APPROVED".equals(p.getSupplier().getStatus())) throw BusinessException.bad("PRODUCT_UNAVAILABLE", "Sản phẩm không còn được bán"); return p; }
    private CartView view(CartItem item) { Product p = item.getProduct(); return new CartView(item.getId(), p.getId(), p.getName(), p.getSupplier().getName(), p.getPrice(), p.getUnit(), item.getQuantity(), p.getPrice().multiply(item.getQuantity())); }
}
