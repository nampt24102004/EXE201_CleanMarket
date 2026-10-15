package com.app.features.feedback.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.auth.security.CurrentUser;
import com.app.features.feedback.dto.RefundControllerDto.*;
import com.app.features.feedback.entity.Refund;
import com.app.features.feedback.enums.RefundStatus;
import com.app.features.feedback.repository.RefundRepository;
import com.app.features.feedback.service.RefundService;
import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.service.NotificationService;
import com.app.features.payments.entity.Payment;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manual refund: staff approve an amount, the customer supplies a bank account, staff check it,
 * transfer the money themselves and record the transfer reference. Every step notifies the other side.
 */
@Service public class RefundServiceImpl implements RefundService {
    private static final List<String> STAFF = List.of("MANAGER", "ADMIN");
    private final RefundRepository refunds; private final CurrentUser current; private final AuditService audit;
    private final NotificationService notifications; private final UserRepository users;
    public RefundServiceImpl(RefundRepository refunds, CurrentUser current, AuditService audit, NotificationService notifications, UserRepository users) {
        this.refunds = refunds; this.current = current; this.audit = audit; this.notifications = notifications; this.users = users;
    }

    @Transactional(readOnly = true) public ApiResponse<List<RefundView>> list(String status) {
        List<Refund> result = status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)
            ? refunds.findAllByOrderByCreatedAtDesc() : refunds.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase(Locale.ROOT));
        return ApiResponse.ok(result.stream().map(this::view).toList());
    }

    @Transactional(readOnly = true) public ApiResponse<List<RefundView>> mine() {
        return ApiResponse.ok(refunds.findByComplaintUserIdOrderByCreatedAtDesc(current.get().getId()).stream().map(this::view).toList());
    }

    @Transactional public ApiResponse<RefundView> submitBankInfo(Long id, @Valid BankInfoRequest request) {
        UserAccount me = current.get();
        Refund refund = refunds.findById(id).filter(r -> r.getComplaint().getUser().getId().equals(me.getId())).orElseThrow(() -> BusinessException.missing("Yêu cầu hoàn tiền"));
        // The customer may correct the account until staff have approved it.
        if (!List.of(RefundStatus.REQUESTED.name(), RefundStatus.BANK_INFO_SUBMITTED.name()).contains(refund.getStatus()))
            throw BusinessException.conflict("REFUND_BANK_LOCKED", "Thông tin tài khoản đã được duyệt, không thể thay đổi");
        refund.setBankName(request.bankName().trim()); refund.setBankAccountNumber(request.accountNumber().trim());
        refund.setBankAccountHolder(request.accountHolder().trim().toUpperCase(Locale.ROOT));
        refund.setBankSubmittedAt(Instant.now()); refund.setBankReviewNote(null); refund.setStatus(RefundStatus.BANK_INFO_SUBMITTED.name());
        audit.record(me, "REFUND_BANK_SUBMITTED", "Refund", id, refund.getBankName());
        String code = refund.getComplaint().getOrder().getOrderCode();
        for (UserAccount staff : users.findByRoleInAndLockedFalse(STAFF))
            notifications.notify(staff, NotificationType.PAYMENT, "Khách gửi STK hoàn tiền đơn " + code,
                me.getFullName() + " đã gửi tài khoản " + refund.getBankName() + " để nhận " + money(refund.getAmount()) + ". Vui lòng kiểm tra và duyệt.", "/manager/refunds");
        return ApiResponse.ok(view(refund));
    }

    @Transactional public ApiResponse<RefundView> approveBankInfo(Long id) {
        Refund refund = inStatus(id, RefundStatus.BANK_INFO_SUBMITTED, "Chỉ duyệt được tài khoản khách vừa gửi");
        refund.setStatus(RefundStatus.APPROVED.name()); refund.setBankReviewNote(null); review(refund);
        audit.record(current.get(), "REFUND_BANK_APPROVED", "Refund", id, null);
        notifyCustomer(refund, "Thông tin hoàn tiền đã được duyệt",
            "CleanMarket sẽ chuyển " + money(refund.getAmount()) + " vào tài khoản " + refund.getBankName() + " ••••" + last4(refund.getBankAccountNumber()) + " trong thời gian sớm nhất.");
        return ApiResponse.ok(view(refund));
    }

    @Transactional public ApiResponse<RefundView> rejectBankInfo(Long id, @Valid ReviewRequest request) {
        Refund refund = inStatus(id, RefundStatus.BANK_INFO_SUBMITTED, "Chỉ từ chối được tài khoản khách vừa gửi");
        refund.setStatus(RefundStatus.REQUESTED.name()); refund.setBankReviewNote(request.reason().trim()); review(refund);
        audit.record(current.get(), "REFUND_BANK_REJECTED", "Refund", id, request.reason());
        notifyCustomer(refund, "Cần cập nhật thông tin nhận hoàn tiền", "Tài khoản bạn gửi chưa hợp lệ: " + request.reason().trim() + ". Vui lòng gửi lại số tài khoản.");
        return ApiResponse.ok(view(refund));
    }

    @Transactional public ApiResponse<RefundView> complete(Long id, @Valid CompletionRequest request) {
        Refund refund = inStatus(id, RefundStatus.APPROVED, "Chỉ hoàn tất được khi tài khoản nhận tiền đã được duyệt");
        refund.setStatus(RefundStatus.MANUAL_COMPLETED.name()); refund.setProviderRef(request.providerRef().trim()); refund.setNote(request.note()); refund.setCompletedAt(Instant.now());
        Payment payment = refund.getPayment();
        BigDecimal completed = refunds.findByPaymentId(payment.getId()).stream().filter(r -> RefundStatus.MANUAL_COMPLETED.name().equals(r.getStatus())).map(Refund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (completed.compareTo(payment.getAmount()) >= 0) payment.setStatus("REFUNDED");
        audit.record(current.get(), "REFUND_MANUAL_COMPLETE", "Refund", id, refund.getProviderRef());
        notifyCustomer(refund, "Đã hoàn tiền đơn " + refund.getComplaint().getOrder().getOrderCode(),
            "CleanMarket đã chuyển " + money(refund.getAmount()) + " vào tài khoản " + refund.getBankName() + " ••••" + last4(refund.getBankAccountNumber()) + ". Mã giao dịch: " + refund.getProviderRef() + ".");
        return ApiResponse.ok(view(refund));
    }

    private Refund inStatus(Long id, RefundStatus status, String message) {
        Refund refund = refunds.findById(id).orElseThrow(() -> BusinessException.missing("Yêu cầu hoàn tiền"));
        if (!status.name().equals(refund.getStatus())) throw BusinessException.conflict("INVALID_REFUND_STATUS", message);
        return refund;
    }
    private void review(Refund refund) { refund.setReviewedBy(current.get()); refund.setReviewedAt(Instant.now()); }
    private void notifyCustomer(Refund refund, String title, String message) {
        notifications.notify(refund.getComplaint().getUser(), NotificationType.PAYMENT, title, message, "/orders/" + refund.getComplaint().getOrder().getOrderCode());
    }
    private static String money(BigDecimal amount) { return String.format(Locale.of("vi", "VN"), "%,.0fđ", amount); }
    private static String last4(String account) { return account == null || account.length() < 4 ? "" : account.substring(account.length() - 4); }
    private RefundView view(Refund r) {
        var c = r.getComplaint();
        return new RefundView(r.getId(), c.getId(), c.getOrder().getOrderCode(), r.getAmount(), r.getStatus(), r.getNote(), r.getProviderRef(),
            c.getUser().getFullName(), c.getUser().getEmail(), r.getBankName(), r.getBankAccountNumber(), r.getBankAccountHolder(),
            r.getBankSubmittedAt(), r.getBankReviewNote(), r.getCreatedAt(), r.getCompletedAt());
    }
}
