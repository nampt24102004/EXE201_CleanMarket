package com.app.features.orders.service;

import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.service.NotificationService;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.SupplierOrder;
import com.app.features.orders.repository.SupplierOrderRepository;
import java.text.NumberFormat;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * Tells each supplier that an order is ready for them to prepare: COD orders right after checkout,
 * payOS orders only once the payment is confirmed (before that the partner has nothing to act on).
 */
@Component
public class PartnerOrderNotifier {
    private final SupplierOrderRepository parts; private final NotificationService notifications;
    public PartnerOrderNotifier(SupplierOrderRepository parts, NotificationService notifications) { this.parts = parts; this.notifications = notifications; }

    public void orderReady(MarketOrder order) {
        NumberFormat money = NumberFormat.getCurrencyInstance(Locale.of("vi", "VN"));
        String payment = "COD".equals(order.getPaymentMethod()) ? "thu tiền khi giao (COD)" : "đã thanh toán qua payOS";
        for (SupplierOrder part : parts.findByOrderId(order.getId())) {
            notifications.notify(part.getSupplier().getOwner(), NotificationType.ORDER, "Đơn hàng mới " + order.getOrderCode(),
                "Bạn có đơn mới trị giá " + money.format(part.getTotalAmount()) + ", " + payment + ". Giao tới " + order.getFullName()
                    + " - " + order.getAddress() + ". Vui lòng xác nhận và chuẩn bị hàng.", "/partner/orders");
        }
    }
}
