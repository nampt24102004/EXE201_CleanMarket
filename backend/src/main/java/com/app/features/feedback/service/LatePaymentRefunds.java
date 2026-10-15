package com.app.features.feedback.service;

import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.feedback.entity.Complaint;
import com.app.features.feedback.entity.Refund;
import com.app.features.feedback.enums.RefundStatus;
import com.app.features.feedback.repository.ComplaintRepository;
import com.app.features.feedback.repository.RefundRepository;
import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.service.NotificationService;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.payments.entity.Payment;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * Money that arrives for an order that was already cancelled (customer paid while the order was being cancelled or expired).
 * The goods are already back in stock, so the order stays cancelled; instead the payment is opened as a full refund
 * that runs through the normal refund flow (customer sends bank details, staff approve and transfer).
 */
@Component
public class LatePaymentRefunds {
    private final ComplaintRepository complaints; private final RefundRepository refunds; private final NotificationService notifications;
    private final UserRepository users; private final AuditService audit;
    public LatePaymentRefunds(ComplaintRepository complaints, RefundRepository refunds, NotificationService notifications, UserRepository users, AuditService audit) {
        this.complaints = complaints; this.refunds = refunds; this.notifications = notifications; this.users = users; this.audit = audit;
    }

    /** Opens a full refund for a payment that settled after its order was cancelled; the payment must already be PAID. */
    public Refund openFor(Payment payment) {
        MarketOrder order = payment.getOrder();
        Complaint complaint = new Complaint(); complaint.setUser(order.getUser()); complaint.setOrder(order);
        complaint.setReason("Thanh toán sau khi đơn bị hủy");
        complaint.setDescription("Hệ thống ghi nhận khách đã thanh toán qua payOS sau khi đơn bị hủy. Mã giao dịch: " + payment.getProviderTransactionNo() + ".");
        complaint.setStatus("RESOLVED"); complaint.setResolution("Tự động hoàn lại toàn bộ số tiền đã thanh toán.");
        complaints.save(complaint);

        Refund refund = new Refund(); refund.setComplaint(complaint); refund.setPayment(payment); refund.setAmount(payment.getAmount());
        refund.setStatus(RefundStatus.REQUESTED.name()); refund.setNote("Hoàn tiền tự động: thanh toán đến sau khi đơn đã hủy");
        refunds.save(refund);
        audit.record(null, "LATE_PAYMENT_REFUND_OPENED", "Refund", refund.getId(), order.getOrderCode());

        String amount = String.format(Locale.of("vi", "VN"), "%,.0fđ", payment.getAmount());
        notifications.notify(order.getUser(), NotificationType.PAYMENT, "Đơn " + order.getOrderCode() + " đã hủy nhưng bạn đã thanh toán",
            "CleanMarket đã nhận " + amount + " cho đơn đã bị hủy và sẽ hoàn lại toàn bộ. Vui lòng vào trang đơn hàng để gửi số tài khoản nhận tiền.",
            "/orders/" + order.getOrderCode());
        for (UserAccount staff : users.findByRoleInAndLockedFalse(List.of("MANAGER", "ADMIN")))
            notifications.notify(staff, NotificationType.PAYMENT, "Cần hoàn tiền đơn đã hủy " + order.getOrderCode(),
                "payOS báo khách đã thanh toán " + amount + " sau khi đơn bị hủy. Đã tạo yêu cầu hoàn tiền, chờ khách gửi số tài khoản.", "/manager/refunds");
        return refund;
    }
}
