package com.app;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.app.common.BusinessException;
import com.app.features.auth.security.CurrentUser;
import com.app.features.cart.repository.CartItemRepository;
import com.app.features.orders.dto.OrderServiceDto.CheckoutRequest;
import com.app.features.orders.repository.OrderItemRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.repository.SupplierOrderRepository;
import com.app.features.orders.service.OrderStatusHistoryService;
import com.app.features.orders.serviceimpl.OrderServiceImpl;
import com.app.features.payments.config.PayOSProperties;
import com.app.features.payments.config.PaymentAvailability;
import com.app.features.payments.provider.PayOSPaymentProvider;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.products.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class PaymentAvailabilityTest {
    @Test void unavailableMethodsAreRejectedBeforeCheckoutTouchesTheCart() {
        PayOSProperties payOS = new PayOSProperties();
        PaymentAvailability availability = new PaymentAvailability(payOS, "", "");
        assertFalse(availability.payOS());
        assertFalse(availability.vnpay());

        CartItemRepository cart = mock(CartItemRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        OrderServiceImpl service = new OrderServiceImpl(cart, mock(ProductRepository.class), orders,
            mock(SupplierOrderRepository.class), mock(OrderItemRepository.class), mock(PaymentRepository.class),
            mock(CurrentUser.class), mock(OrderStatusHistoryService.class), mock(ApplicationEventPublisher.class),
            mock(PayOSPaymentProvider.class), availability);

        for (String method : new String[] {"PAYOS", "VNPAY"}) {
            BusinessException error = assertThrows(BusinessException.class,
                () -> service.checkout(new CheckoutRequest("Buyer", "0912345678", "Hanoi", "", method)));
            assertEquals(method + "_NOT_CONFIGURED", error.code());
        }
        verifyNoInteractions(cart, orders);
    }

    @Test void methodIsAvailableOnlyWhenAllRequiredCredentialsExist() {
        PayOSProperties payOS = new PayOSProperties();
        payOS.setClientId("client");
        payOS.setApiKey("api-key");
        PaymentAvailability partial = new PaymentAvailability(payOS, "merchant", "");
        assertFalse(partial.payOS());
        assertFalse(partial.vnpay());

        payOS.setChecksumKey("checksum");
        PaymentAvailability configured = new PaymentAvailability(payOS, "merchant", "hash");
        assertTrue(configured.payOS());
        assertTrue(configured.vnpay());
        assertDoesNotThrow(() -> configured.requireConfigured("PAYOS"));
        assertDoesNotThrow(() -> configured.requireConfigured("VNPAY"));
    }
}
