package com.app.features.orders.service;

import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.service.NotificationService;
import com.app.features.orders.entity.MarketOrder;
import org.springframework.stereotype.Component;

/** Keeps the customer informed (in-app + email) whenever their order moves on without them doing anything. */
@Component
public class BuyerOrderNotifier {
    private final NotificationService notifications;
    public BuyerOrderNotifier(NotificationService notifications) { this.notifications = notifications; }

    public void statusChanged(MarketOrder order, String status) {
        switch (status) {
            case "CONFIRMED" -> send(order, "Đơn hàng " + order.getOrderCode() + " đã được xác nhận", "Nhà cung cấp đã xác nhận và đang chuẩn bị hàng cho bạn.");
            case "SHIPPED" -> send(order, "Đơn hàng " + order.getOrderCode() + " đang được giao", "Hàng đã được giao cho đơn vị vận chuyển, vui lòng để ý điện thoại " + order.getPhone() + ".");
            case "DELIVERED" -> send(order, "Đơn hàng " + order.getOrderCode() + " đã giao thành công", "Cảm ơn bạn đã mua sắm tại CleanMarket. Hãy đánh giá sản phẩm để giúp người mua khác nhé!");
            default -> { }
        }
    }

    public void orderCancelled(MarketOrder order, String reason) {
        send(order, "Đơn hàng " + order.getOrderCode() + " đã bị hủy", reason);
    }

    private void send(MarketOrder order, String title, String message) {
        notifications.notify(order.getUser(), NotificationType.ORDER, title, message, "/orders/" + order.getOrderCode());
    }
}
