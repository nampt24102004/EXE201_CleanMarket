package com.app.features.payments.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.auth.security.CurrentUser;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.payments.dto.PaymentServiceDto.PaymentStatus;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.payments.service.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository payments;
    private final OrderRepository orders;
    private final CurrentUser current;

    public PaymentServiceImpl(PaymentRepository payments, OrderRepository orders, CurrentUser current) {
        this.payments = payments;
        this.orders = orders;
        this.current = current;
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatus status(String orderCode) {
        MarketOrder order = orders.findByOrderCode(orderCode)
            .orElseThrow(() -> BusinessException.missing("Đơn hàng"));
        if (!order.getUser().getId().equals(current.get().getId())) throw BusinessException.forbidden();
        Payment payment = payments.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream()
            .findFirst()
            .orElseThrow(() -> BusinessException.missing("Thanh toán"));
        return new PaymentStatus(orderCode, payment.getProvider(), payment.getStatus(), payment.getAmount());
    }
}
