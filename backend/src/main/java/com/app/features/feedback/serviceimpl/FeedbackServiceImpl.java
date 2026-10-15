package com.app.features.feedback.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.feedback.dto.FeedbackControllerDto.ComplaintRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ComplaintView;
import com.app.features.feedback.dto.FeedbackControllerDto.RefundRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.RefundView;
import com.app.features.feedback.dto.FeedbackControllerDto.ResolutionRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ReviewRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ReviewView;
import com.app.features.feedback.entity.Complaint;
import com.app.features.feedback.entity.Refund;
import com.app.features.feedback.entity.Review;
import com.app.features.feedback.repository.ComplaintRepository;
import com.app.features.feedback.repository.RefundRepository;
import com.app.features.feedback.repository.ReviewRepository;
import com.app.features.feedback.service.FeedbackService;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.OrderItem;
import com.app.features.orders.repository.OrderItemRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.repository.PaymentRepository;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly = true)
public class FeedbackServiceImpl implements FeedbackService {
    private final ReviewRepository reviews; private final OrderItemRepository items; private final OrderRepository orders; private final ComplaintRepository complaints; private final PaymentRepository payments; private final RefundRepository refunds; private final CurrentUser current; private final AuditService audit; private final com.app.features.notifications.service.NotificationService notifications; private final com.app.features.orders.repository.SupplierOrderRepository supplierOrders;
    public FeedbackServiceImpl(ReviewRepository reviews, OrderItemRepository items, OrderRepository orders, ComplaintRepository complaints, PaymentRepository payments, RefundRepository refunds, CurrentUser current, AuditService audit, com.app.features.notifications.service.NotificationService notifications, com.app.features.orders.repository.SupplierOrderRepository supplierOrders) { this.reviews = reviews; this.items = items; this.orders = orders; this.complaints = complaints; this.payments = payments; this.refunds = refunds; this.current = current; this.audit = audit; this.notifications = notifications; this.supplierOrders = supplierOrders; }
    public ApiResponse<List<ReviewView>> productReviews(Long productId) { return ApiResponse.ok(reviews.findByOrderItemProductId(productId).stream().map(this::review).toList()); }
    @Transactional public ApiResponse<ReviewView> review(@Valid ReviewRequest request) {
        UserAccount user = current.get(); OrderItem item = items.findById(request.orderItemId()).orElseThrow(() -> BusinessException.missing("Mục đơn hàng"));
        if (!item.getSupplierOrder().getOrder().getUser().getId().equals(user.getId()) || !"DELIVERED".equals(item.getSupplierOrder().getStatus())) throw BusinessException.forbidden();
        if (reviews.existsByUserIdAndOrderItemId(user.getId(), item.getId())) throw BusinessException.conflict("ALREADY_REVIEWED", "Bạn đã đánh giá sản phẩm này");
        Review review = new Review(); review.setUser(user); review.setOrderItem(item); review.setProduct(item.getProduct()); review.setSupplier(item.getSupplierOrder().getSupplier()); review.setRating(request.rating()); review.setComment(request.comment().trim()); reviews.save(review); return ApiResponse.ok(review(review));
    }
    @Transactional public ApiResponse<ComplaintView> complaint(@Valid ComplaintRequest request) {
        UserAccount user = current.get(); MarketOrder order = orders.findById(request.orderId()).orElseThrow(() -> BusinessException.missing("Đơn hàng")); if (!order.getUser().getId().equals(user.getId())) throw BusinessException.forbidden();
        if ("CANCELLED".equals(order.getStatus())) throw BusinessException.bad("ORDER_CANCELLED", "Không thể khiếu nại đơn hàng đã hủy");
        if (complaints.existsByOrderIdAndStatus(order.getId(), "PENDING")) throw BusinessException.conflict("COMPLAINT_PENDING", "Đơn hàng đã có khiếu nại đang chờ xử lý");
        Complaint c = new Complaint(); c.setUser(user); c.setOrder(order); c.setReason(request.reason().trim()); c.setDescription(request.description().trim());
        if (request.supplierOrderId() != null) c.setSupplierOrder(supplierOrders.findById(request.supplierOrderId())
            .filter(part -> part.getOrder().getId().equals(order.getId())).orElseThrow(() -> BusinessException.bad("INVALID_SUPPLIER_ORDER", "Nhà cung cấp không thuộc đơn hàng này")));
        complaints.save(c);
        for (var part : involvedParts(c)) notifications.notify(part.getSupplier().getOwner(), com.app.features.notifications.enums.NotificationType.ORDER,
            "Khiếu nại mới về đơn " + order.getOrderCode(), "Khách hàng phản ánh: " + c.getReason() + " - " + c.getDescription(), "/partner/orders");
        return ApiResponse.ok(complaint(c));
    }
    public ApiResponse<List<ComplaintView>> myComplaints() { return ApiResponse.ok(complaints.findByUserIdOrderByCreatedAtDesc(current.get().getId()).stream().map(this::complaint).toList()); }
    public ApiResponse<List<ComplaintView>> pending() { return ApiResponse.ok(complaints.findByStatusOrderByCreatedAtDesc("PENDING").stream().map(this::complaint).toList()); }
    @Transactional public ApiResponse<ComplaintView> resolve(Long id, @Valid ResolutionRequest request) {
        Complaint c = complaints.findById(id).orElseThrow(() -> BusinessException.missing("Khiếu nại")); if (!"PENDING".equals(c.getStatus())) throw BusinessException.conflict("ALREADY_RESOLVED", "Khiếu nại đã được xử lý"); c.setStatus("RESOLVED"); c.setResolution(request.resolution().trim()); complaints.save(c); audit.record(current.get(), "COMPLAINT_RESOLVE", "Complaint", id, request.resolution());
        notifications.notify(c.getUser(), com.app.features.notifications.enums.NotificationType.ORDER, "Khiếu nại đơn " + c.getOrder().getOrderCode() + " đã được xử lý",
            "Phương án xử lý: " + c.getResolution(), "/orders/" + c.getOrder().getOrderCode());
        for (var part : involvedParts(c)) notifications.notify(part.getSupplier().getOwner(), com.app.features.notifications.enums.NotificationType.ORDER,
            "Khiếu nại đơn " + c.getOrder().getOrderCode() + " đã được xử lý", "Phương án xử lý: " + c.getResolution(), "/partner/orders");
        return ApiResponse.ok(complaint(c));
    }
    @Transactional public ApiResponse<RefundView> refund(Long id, @Valid RefundRequest request) {
        Complaint c = complaints.findById(id).orElseThrow(() -> BusinessException.missing("Khiếu nại")); Payment paid = payments.findByOrderIdOrderByCreatedAtDesc(c.getOrder().getId()).stream().filter(p -> "PAID".equals(p.getStatus())).findFirst().orElseThrow(() -> BusinessException.bad("PAYMENT_NOT_PAID", "Đơn hàng chưa được thanh toán"));
        paid = payments.lockById(paid.getId()).orElseThrow(() -> BusinessException.missing("Thanh toán"));
        if (refunds.existsByComplaintId(id)) throw BusinessException.conflict("REFUND_EXISTS", "Khiếu nại đã có yêu cầu hoàn tiền");
        BigDecimal requested = refunds.findByPaymentId(paid.getId()).stream().map(Refund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (requested.add(request.amount()).compareTo(paid.getAmount()) > 0) throw BusinessException.bad("REFUND_TOO_LARGE", "Tổng số tiền hoàn vượt giá trị đơn hàng");
        Refund refund = new Refund(); refund.setComplaint(c); refund.setPayment(paid); refund.setAmount(request.amount()); refund.setNote(request.note()); refunds.save(refund); audit.record(current.get(), "REFUND_REQUEST", "Refund", refund.getId(), "Chờ xử lý thủ công");
        notifications.notify(c.getUser(), com.app.features.notifications.enums.NotificationType.PAYMENT, "Đơn " + c.getOrder().getOrderCode() + " được duyệt hoàn tiền",
            "CleanMarket đã duyệt hoàn " + refund.getAmount().toPlainString() + "đ cho khiếu nại của bạn. Vui lòng vào trang đơn hàng để gửi số tài khoản nhận tiền.", "/orders/" + c.getOrder().getOrderCode());
        return ApiResponse.ok(new RefundView(refund.getId(), id, refund.getAmount(), refund.getStatus()));
    }
    private ReviewView review(Review r) { return new ReviewView(r.getId(), r.getOrderItem().getId(), r.getOrderItem().getProduct().getId(), r.getRating(), r.getComment(), r.getUser().getFullName()); }
    public ApiResponse<List<ComplaintView>> partnerComplaints() { return ApiResponse.ok(complaints.findForSupplierOwner(current.get().getId()).stream().map(this::complaint).toList()); }
    private ComplaintView complaint(Complaint c) {
        var part = c.getSupplierOrder();
        return new ComplaintView(c.getId(), c.getOrder().getOrderCode(), c.getReason(), c.getDescription(), c.getStatus(), c.getResolution(),
            part == null ? null : part.getId(), part == null ? null : part.getSupplier().getName(), c.getCreatedAt());
    }
    /** The supplier parts a complaint concerns: the one it names, or every part of the order. */
    private List<com.app.features.orders.entity.SupplierOrder> involvedParts(Complaint c) {
        return c.getSupplierOrder() != null ? List.of(c.getSupplierOrder()) : supplierOrders.findByOrderId(c.getOrder().getId());
    }
}
