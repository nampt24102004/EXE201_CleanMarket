package com.app.features.feedback.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.feedback.dto.RefundControllerDto.CompletionRequest;
import com.app.features.feedback.dto.RefundControllerDto.RefundView;
import com.app.features.feedback.entity.Refund;
import com.app.features.feedback.repository.RefundRepository;
import com.app.features.feedback.service.RefundService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class RefundServiceImpl implements RefundService {
    private final RefundRepository refunds; private final CurrentUser current; private final AuditService audit;
    public RefundServiceImpl(RefundRepository refunds, CurrentUser current, AuditService audit) { this.refunds = refunds; this.current = current; this.audit = audit; }
    @Transactional(readOnly = true) public ApiResponse<List<RefundView>> list() { return ApiResponse.ok(refunds.findAll().stream().map(this::view).toList()); }
    @Transactional public ApiResponse<RefundView> complete(Long id, @Valid CompletionRequest request) {
        Refund refund = refunds.findById(id).orElseThrow(() -> BusinessException.missing("Yêu cầu hoàn tiền"));
        if (!"REQUESTED".equals(refund.getStatus())) throw BusinessException.conflict("REFUND_ALREADY_HANDLED", "Yêu cầu hoàn tiền đã được xử lý");
        refund.setStatus("MANUAL_COMPLETED"); refund.setProviderRef(request.providerRef().trim()); refund.setNote(request.note()); refunds.save(refund);
        audit.record(current.get(), "REFUND_MANUAL_COMPLETE", "Refund", id, refund.getProviderRef()); return ApiResponse.ok(view(refund));
    }
    private RefundView view(Refund r) { return new RefundView(r.getId(), r.getComplaint().getId(), r.getComplaint().getOrder().getOrderCode(), r.getAmount(), r.getStatus(), r.getNote(), r.getProviderRef()); }
}
