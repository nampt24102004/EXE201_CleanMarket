package com.app;

import com.app.common.BusinessException;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.cart.repository.CartItemRepository;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.OrderItem;
import com.app.features.orders.entity.SupplierOrder;
import com.app.features.orders.repository.OrderItemRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.repository.SupplierOrderRepository;
import com.app.features.orders.service.OrderStatusHistoryService;
import com.app.features.orders.serviceimpl.OrderServiceImpl;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.provider.PayOSPaymentProvider;
import com.app.features.payments.provider.PaymentProviderDto;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.promotions.service.VoucherService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayOSOrderCancellationTest {
    @Mock CartItemRepository cart;
    @Mock ProductRepository products;
    @Mock OrderRepository orders;
    @Mock SupplierOrderRepository supplierOrders;
    @Mock OrderItemRepository orderItems;
    @Mock PaymentRepository payments;
    @Mock CurrentUser current;
    @Mock OrderStatusHistoryService history;
    @Mock ApplicationEventPublisher events;
    @Mock PayOSPaymentProvider provider;
    @Mock VoucherService voucherService;

    OrderServiceImpl service;
    UserAccount user;
    MarketOrder order;
    Payment payment;
    Product product;
    SupplierOrder part;

    @BeforeEach void setup() {
        service = new OrderServiceImpl(cart, products, orders, supplierOrders, orderItems, payments,
            current, history, events, provider, voucherService);
        user = new UserAccount(); user.setId(10L);
        order = new MarketOrder(); order.setId(100L); order.setUser(user); order.setOrderCode("CM100");
        order.setStatus("PENDING_PAYMENT"); order.setPaymentMethod("PAYOS"); order.setTotalAmount(new BigDecimal("2000"));
        order.setFullName("Buyer"); order.setPhone("0912345678"); order.setAddress("Hà Nội");
        Supplier supplier = new Supplier(); supplier.setId(5L); supplier.setName("Farm");
        part = new SupplierOrder(); part.setId(7L); part.setOrder(order); part.setSupplier(supplier);
        part.setStatus("CREATED"); part.setTotalAmount(order.getTotalAmount());
        product = new Product(); product.setId(20L); product.setStock(new BigDecimal("8"));
        OrderItem item = new OrderItem(); item.setId(30L); item.setSupplierOrder(part); item.setProduct(product);
        item.setProductNameSnapshot("Rau cải"); item.setUnitPrice(new BigDecimal("1000")); item.setUnit("kg");
        item.setQuantity(new BigDecimal("2")); item.setTotalAmount(new BigDecimal("2000"));
        payment = new Payment(); payment.setId(50L); payment.setOrder(order); payment.setProvider("PAYOS");
        payment.setStatus("PENDING"); payment.setAmount(order.getTotalAmount()); payment.setTxnRef("PAYOS-50");
        payment.setProviderOrderCode(50L); payment.setProviderPaymentLinkId("link-50");
        when(orders.lockById(order.getId())).thenReturn(Optional.of(order));
        when(current.get()).thenReturn(user);
        when(supplierOrders.findByOrderId(order.getId())).thenReturn(List.of(part));
        when(payments.findByOrderIdOrderByCreatedAtDesc(order.getId())).thenReturn(List.of(payment));
        lenient().when(orderItems.findBySupplierOrderId(part.getId())).thenReturn(List.of(item));
        lenient().when(products.lockById(product.getId())).thenReturn(Optional.of(product));
    }

    @Test void pendingPayOSLinkIsCancelledBeforeOrderAndStockAreRestored() {
        when(provider.getPaymentStatus(payment)).thenReturn(status("PENDING", 0L));
        when(provider.cancelPayment(payment, "Khách hàng hủy đơn CleanMarket")).thenReturn(status("CANCELLED", 0L));

        var result = service.cancel(order.getId());

        assertEquals("CANCELLED", result.status());
        assertEquals("CANCELLED", payment.getStatus());
        assertEquals("CANCELLED", part.getStatus());
        assertEquals(0, product.getStock().compareTo(new BigDecimal("10")));
        verify(provider).cancelPayment(payment, "Khách hàng hủy đơn CleanMarket");
    }

    @Test void paidPayOSLinkCannotBeCancelled() {
        when(provider.getPaymentStatus(payment)).thenReturn(status("PAID", 2000L));

        BusinessException error = assertThrows(BusinessException.class, () -> service.cancel(order.getId()));

        assertEquals("PAYMENT_ALREADY_PAID", error.code());
        assertEquals("PENDING_PAYMENT", order.getStatus());
        assertEquals(0, product.getStock().compareTo(new BigDecimal("8")));
        verify(provider, never()).cancelPayment(any(), anyString());
    }

    private PaymentProviderDto.StatusResult status(String status, Long amountPaid) {
        return new PaymentProviderDto.StatusResult(50L, 2000L, amountPaid, status, "link-50", null);
    }
}
