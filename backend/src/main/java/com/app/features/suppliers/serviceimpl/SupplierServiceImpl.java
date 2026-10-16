package com.app.features.suppliers.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.entity.*;
import com.app.features.auth.repository.*;
import com.app.features.auth.security.CurrentUser;
import com.app.features.storage.service.StorageService;
import com.app.features.suppliers.dto.SupplierControllerDto.*;
import com.app.features.suppliers.entity.*;
import com.app.features.suppliers.enums.SupplierDocumentStatus;
import com.app.features.suppliers.repository.*;
import com.app.features.suppliers.service.SupplierService;
import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.service.NotificationService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service @Transactional(readOnly = true)
public class SupplierServiceImpl implements SupplierService {
    private static final Set<String> TYPES = Set.of("FARM","COOPERATIVE","HOUSEHOLD_BUSINESS","COMPANY","OTHER");
    private static final Set<String> DOCUMENT_TYPES = Set.of("BUSINESS_LICENSE","FOOD_SAFETY","VIETGAP","ORGANIC","OCOP","OTHER");
    private static final Set<String> FILE_EXTENSIONS = Set.of("pdf","jpg","jpeg","png");
    private final SupplierRepository suppliers;
    private final SupplierDocumentRepository documents;
    private final CurrentUser current;
    private final AuditService audit;
    private final StorageService storage;
    private final RoleRepository roles;
    private final UserRoleAssignmentRepository userRoles;
    private final int maxFiles;
    private final NotificationService notifications;

    public SupplierServiceImpl(SupplierRepository suppliers, SupplierDocumentRepository documents, CurrentUser current,
            AuditService audit, StorageService storage, RoleRepository roles, UserRoleAssignmentRepository userRoles,
            @Value("${app.upload.max-files:8}") int maxFiles, NotificationService notifications) {
        this.suppliers=suppliers; this.documents=documents; this.current=current; this.audit=audit;
        this.storage=storage; this.roles=roles; this.userRoles=userRoles; this.maxFiles=maxFiles; this.notifications=notifications;
    }

    @Override @Transactional public ApiResponse<SupplierView> apply(ApplicationRequest request) {
        UserAccount user=current.get();
        if (suppliers.findByOwnerId(user.getId()).isPresent()) throw BusinessException.conflict("SUPPLIER_ALREADY_EXISTS","Bạn đã có hồ sơ nhà cung cấp");
        validateType(request.supplierType());
        Supplier s=new Supplier(); s.setOwner(user); s.setName(request.supplierName().trim());
        s.setEmail(blank(request.email()) ? user.getEmail() : request.email().trim().toLowerCase());
        s.setPhone(request.phone().trim()); s.setLocation(request.address().trim()); s.setSupplierType(request.supplierType());
        s.setDescription(request.description()); s.setDocumentUrl(request.documentUrl()); suppliers.save(s);
        audit.record(user,"SUPPLIER_SUBMITTED","Supplier",s.getId(),null);
        return ApiResponse.ok(view(s),"Đăng ký nhà cung cấp thành công");
    }

    @Override public ApiResponse<SupplierView> mine() {
        return ApiResponse.ok(view(suppliers.findByOwnerId(current.get().getId()).orElseThrow(() -> BusinessException.missing("Hồ sơ nhà cung cấp"))));
    }

    @Override @Transactional public ApiResponse<SupplierView> updateApplication(ProfileRequest request) {
        Supplier s=owned();
        if (!Set.of("PENDING","REJECTED").contains(s.getStatus())) throw BusinessException.conflict("INVALID_SUPPLIER_STATUS","Không thể sửa hồ sơ ở trạng thái hiện tại");
        fill(s,request); suppliers.save(s); audit.record(current.get(),"SUPPLIER_UPDATED","Supplier",s.getId(),null);
        return ApiResponse.ok(view(s));
    }

    @Override @Transactional public ApiResponse<SupplierView> updateProfile(ProfileRequest request) {
        Supplier s=owned();
        if (!"APPROVED".equals(s.getStatus())) throw BusinessException.bad("NOT_APPROVED_PARTNER","Nhà cung cấp chưa được phê duyệt");
        fill(s,request); suppliers.save(s); audit.record(current.get(),"SUPPLIER_PROFILE_UPDATE","Supplier",s.getId(),null);
        return ApiResponse.ok(view(s));
    }

    @Override @Transactional public ApiResponse<DocumentView> uploadDocument(String type, String documentName, LocalDate expiryDate, MultipartFile file) {
        Supplier s=owned();
        if (!Set.of("PENDING","REJECTED").contains(s.getStatus())) throw BusinessException.conflict("INVALID_SUPPLIER_STATUS","Không thể bổ sung giấy tờ ở trạng thái hiện tại");
        return storeDocument(s,type,documentName,expiryDate,file);
    }

    @Override @Transactional public ApiResponse<DocumentView> uploadPartnerDocument(String type, String documentName, LocalDate expiryDate, MultipartFile file) {
        Supplier s=owned();
        if (!"APPROVED".equals(s.getStatus())) throw BusinessException.bad("NOT_APPROVED_PARTNER","Nhà cung cấp chưa được phê duyệt");
        return storeDocument(s,type,documentName,expiryDate,file);
    }

    /** Owners may withdraw a document that is not (or no longer) accepted; approved documents stay as the review record. */
    @Override @Transactional public ApiResponse<SupplierView> deleteDocument(Long documentId) {
        Supplier s=owned(); SupplierDocument d=findDocument(s.getId(),documentId);
        if (d.getStatus()==SupplierDocumentStatus.APPROVED && !d.expiredOn(today())) throw BusinessException.conflict("DOCUMENT_APPROVED","Không thể xóa giấy tờ đã được duyệt");
        if ("SUSPENDED".equals(s.getStatus())) throw BusinessException.conflict("INVALID_SUPPLIER_STATUS","Nhà cung cấp đang bị tạm dừng");
        documents.delete(d); storage.delete(d.getObjectKey());
        audit.record(current.get(),"SUPPLIER_DOCUMENT_DELETED","SupplierDocument",documentId,d.getType());
        return ApiResponse.ok(view(s));
    }

    private ApiResponse<DocumentView> storeDocument(Supplier s, String type, String documentName, LocalDate expiryDate, MultipartFile file) {
        String normalized=normalize(type); if (!DOCUMENT_TYPES.contains(normalized)) throw BusinessException.bad("INVALID_DOCUMENT","Loại giấy tờ không hợp lệ");
        if (expiryDate!=null && expiryDate.isBefore(LocalDate.now(DateRange.ZONE))) throw BusinessException.bad("DOCUMENT_EXPIRED","Giấy tờ đã hết hạn, vui lòng tải bản còn hiệu lực");
        // Rejected and expired files do not count toward the limit, so a supplier can always upload a replacement.
        long active=documents.findBySupplierId(s.getId()).stream().filter(d->d.getStatus()!=SupplierDocumentStatus.REJECTED && !d.expiredOn(today())).count();
        if (active >= maxFiles) throw BusinessException.bad("INVALID_DOCUMENT","Đã vượt quá số lượng file cho phép");
        var stored=storage.upload(file,"suppliers/"+s.getId(),FILE_EXTENSIONS);
        SupplierDocument d=new SupplierDocument(); d.setSupplier(s); d.setType(normalized); d.setExpiryDate(expiryDate);
        d.setDocumentName(blank(documentName) ? normalized : documentName.trim()); d.setOriginalFileName(stored.originalFileName());
        d.setObjectKey(stored.objectKey()); d.setFileUrl(stored.fileUrl()); d.setUploadedAt(Instant.now()); documents.save(d);
        audit.record(current.get(),"SUPPLIER_DOCUMENT_UPLOADED","SupplierDocument",d.getId(),normalized);
        return ApiResponse.ok(documentView(d));
    }

    @Override @Transactional public ApiResponse<SupplierView> resubmit() {
        Supplier s=owned();
        if (!"REJECTED".equals(s.getStatus())) throw BusinessException.conflict("INVALID_SUPPLIER_STATUS","Chỉ hồ sơ bị từ chối mới có thể gửi lại");
        List<SupplierDocument> docs=documents.findBySupplierId(s.getId());
        if (docs.stream().anyMatch(d->d.getStatus()==SupplierDocumentStatus.REJECTED||d.expiredOn(today())))
            throw BusinessException.bad("DOCUMENT_REJECTED","Vui lòng xóa hoặc thay thế giấy tờ bị từ chối/hết hạn trước khi gửi lại");
        if (docs.isEmpty() && blank(s.getDocumentUrl())) throw BusinessException.bad("INVALID_DOCUMENT","Vui lòng tải ít nhất một giấy tờ");
        s.setStatus("PENDING"); s.setRejectionReason(null); s.setReviewedAt(null); s.setReviewedBy(null); suppliers.save(s);
        audit.record(current.get(),"SUPPLIER_RESUBMITTED","Supplier",s.getId(),null); return ApiResponse.ok(view(s));
    }

    @Override public ApiResponse<List<SupplierView>> list(String status) {
        List<Supplier> result=blank(status)||"ALL".equalsIgnoreCase(status) ? suppliers.findAllByOrderByCreatedAtDesc() : suppliers.findByStatus(status.toUpperCase());
        return ApiResponse.ok(result.stream().map(this::view).toList());
    }
    @Override public ApiResponse<SupplierView> detail(Long id) { return ApiResponse.ok(view(find(id))); }

    @Override @Transactional public ApiResponse<SupplierView> approve(Long id) {
        Supplier s=findPending(id);
        List<SupplierDocument> docs=documents.findBySupplierId(id);
        if (docs.isEmpty() && blank(s.getDocumentUrl())) throw BusinessException.bad("INVALID_DOCUMENT","Hồ sơ chưa có giấy tờ");
        // A document the reviewer rejected (or that expired) must be withdrawn or replaced first; approving the profile never overrides that decision.
        if (docs.stream().anyMatch(d->d.getStatus()==SupplierDocumentStatus.REJECTED||d.expiredOn(today())))
            throw BusinessException.conflict("DOCUMENT_REJECTED","Hồ sơ còn giấy tờ bị từ chối hoặc hết hạn; hãy từ chối hồ sơ để nhà cung cấp thay thế");
        UserAccount reviewer=current.get(); s.setStatus("APPROVED"); s.setRejectionReason(null); s.setReviewedBy(reviewer); s.setReviewedAt(Instant.now());
        docs.stream().filter(d->d.getStatus()==SupplierDocumentStatus.PENDING).forEach(d->{ d.setStatus(SupplierDocumentStatus.APPROVED); d.setReviewedBy(reviewer); d.setReviewedAt(Instant.now()); });
        grantPartner(s.getOwner()); suppliers.save(s); audit.record(reviewer,"SUPPLIER_APPROVED","Supplier",id,null);
        notifications.notify(s.getOwner(), NotificationType.SUPPLIER, "Hồ sơ nhà cung cấp đã được duyệt",
            "Hồ sơ \"" + s.getName() + "\" đã được phê duyệt. Bạn có thể bắt đầu đăng sản phẩm trên CleanMarket.", "/partner");
        return ApiResponse.ok(view(s));
    }

    @Override @Transactional public ApiResponse<SupplierView> reject(Long id, DecisionRequest request) {
        Supplier s=findPending(id); UserAccount reviewer=current.get(); s.setStatus("REJECTED"); s.setRejectionReason(request.reason().trim());
        s.setReviewedBy(reviewer); s.setReviewedAt(Instant.now()); suppliers.save(s);
        audit.record(reviewer,"SUPPLIER_REJECTED","Supplier",id,request.reason());
        notifications.notify(s.getOwner(), NotificationType.SUPPLIER, "Hồ sơ nhà cung cấp bị từ chối",
            "Hồ sơ \"" + s.getName() + "\" chưa được duyệt. Lý do: " + request.reason().trim() + "\nVui lòng chỉnh sửa, bổ sung giấy tờ và gửi lại.", "/partner/register");
        return ApiResponse.ok(view(s));
    }

    @Override @Transactional public ApiResponse<SupplierView> suspend(Long id, DecisionRequest request) {
        Supplier s=find(id); if (!"APPROVED".equals(s.getStatus())) throw BusinessException.conflict("SUPPLIER_NOT_ACTIVE","Chỉ tạm dừng được nhà cung cấp đang hoạt động");
        UserAccount reviewer=current.get(); s.setStatus("SUSPENDED"); s.setRejectionReason(request.reason().trim()); s.setReviewedBy(reviewer); s.setReviewedAt(Instant.now()); suppliers.save(s);
        audit.record(reviewer,"SUPPLIER_SUSPENDED","Supplier",id,request.reason());
        notifications.notify(s.getOwner(), NotificationType.SUPPLIER, "Nhà cung cấp bị tạm dừng",
            "Gian hàng \"" + s.getName() + "\" tạm dừng hoạt động. Lý do: " + request.reason().trim(), "/partner");
        return ApiResponse.ok(view(s));
    }

    @Override @Transactional public ApiResponse<SupplierView> reactivate(Long id) {
        Supplier s=find(id); if (!"SUSPENDED".equals(s.getStatus())) throw BusinessException.conflict("SUPPLIER_NOT_SUSPENDED","Nhà cung cấp không ở trạng thái tạm dừng");
        UserAccount reviewer=current.get(); s.setStatus("APPROVED"); s.setRejectionReason(null); s.setReviewedBy(reviewer); s.setReviewedAt(Instant.now()); suppliers.save(s);
        audit.record(reviewer,"SUPPLIER_REACTIVATED","Supplier",id,null);
        notifications.notify(s.getOwner(), NotificationType.SUPPLIER, "Nhà cung cấp hoạt động trở lại", "Gian hàng \"" + s.getName() + "\" đã được mở lại.", "/partner");
        return ApiResponse.ok(view(s));
    }

    @Override @Transactional public ApiResponse<SupplierView> approveDocument(Long supplierId, Long documentId) {
        Supplier supplier=find(supplierId); SupplierDocument document=reviewable(supplier,documentId); UserAccount reviewer=current.get();
        document.setStatus(SupplierDocumentStatus.APPROVED); document.setRejectionReason(null); document.setReviewedBy(reviewer); document.setReviewedAt(Instant.now()); documents.save(document);
        audit.record(reviewer,"SUPPLIER_DOCUMENT_APPROVED","SupplierDocument",documentId,null);
        // During the initial review the profile decision is what gets announced; afterwards each extra document is its own decision.
        if (!"PENDING".equals(supplier.getStatus()))
            notifications.notify(supplier.getOwner(), NotificationType.SUPPLIER, "Giấy tờ đã được duyệt", "Giấy tờ \"" + document.getDocumentName() + "\" đã được duyệt.", "/partner/profile");
        return ApiResponse.ok(view(supplier));
    }

    @Override @Transactional public ApiResponse<SupplierView> rejectDocument(Long supplierId, Long documentId, DecisionRequest request) {
        Supplier supplier=find(supplierId); SupplierDocument document=reviewable(supplier,documentId); UserAccount reviewer=current.get();
        document.setStatus(SupplierDocumentStatus.REJECTED); document.setRejectionReason(request.reason().trim()); document.setReviewedBy(reviewer); document.setReviewedAt(Instant.now()); documents.save(document);
        audit.record(reviewer,"SUPPLIER_DOCUMENT_REJECTED","SupplierDocument",documentId,request.reason());
        notifications.notify(supplier.getOwner(), NotificationType.SUPPLIER, "Giấy tờ bị từ chối",
            "Giấy tờ \"" + document.getDocumentName() + "\" bị từ chối. Lý do: " + request.reason().trim() + "\nVui lòng xóa và tải lại bản hợp lệ.",
            "PENDING".equals(supplier.getStatus()) ? "/partner/register" : "/partner/profile");
        return ApiResponse.ok(view(supplier));
    }

    /** Pending documents can be reviewed any time; while the profile is still under review the reviewer may also change an earlier decision. */
    private SupplierDocument reviewable(Supplier supplier, Long documentId) {
        SupplierDocument document=findDocument(supplier.getId(),documentId);
        if ("REJECTED".equals(supplier.getStatus())) throw BusinessException.conflict("INVALID_SUPPLIER_STATUS","Hồ sơ đã bị từ chối, chờ nhà cung cấp gửi lại");
        if (document.expiredOn(today())) throw BusinessException.conflict("DOCUMENT_EXPIRED","Giấy tờ đã hết hạn");
        if (document.getStatus()!=SupplierDocumentStatus.PENDING && !"PENDING".equals(supplier.getStatus()))
            throw BusinessException.conflict("DOCUMENT_ALREADY_REVIEWED","Giấy tờ đã được xử lý");
        return document;
    }

    private void grantPartner(UserAccount user) {
        Role role=roles.findByNameIgnoreCase("PARTNER").orElseGet(()->{Role r=new Role();r.setName("PARTNER");r.setDescription("Nhà cung cấp");return roles.save(r);});
        if (!userRoles.existsByUserIdAndRoleId(user.getId(),role.getId())) {
            UserRoleAssignment a=new UserRoleAssignment(); a.setUser(user); a.setRole(role); userRoles.save(a);
        }
        ensureUserRole(user); user.setRole("PARTNER");
    }
    private void ensureUserRole(UserAccount user) {
        Role role=roles.findByNameIgnoreCase("USER").orElseGet(()->{Role r=new Role();r.setName("USER");r.setDescription("Khách hàng");return roles.save(r);});
        if (!userRoles.existsByUserIdAndRoleId(user.getId(),role.getId())) { UserRoleAssignment a=new UserRoleAssignment();a.setUser(user);a.setRole(role);userRoles.save(a); }
    }
    private void fill(Supplier s, ProfileRequest r) { String type=blank(r.supplierType())?s.getSupplierType():r.supplierType();validateType(type);s.setName(r.supplierName().trim());if(!blank(r.email()))s.setEmail(r.email().trim().toLowerCase());if(!blank(r.phone()))s.setPhone(r.phone().trim());s.setLocation(r.address().trim());s.setSupplierType(type.toUpperCase());s.setDescription(r.description()); }
    private Supplier owned(){return suppliers.findByOwnerId(current.get().getId()).orElseThrow(()->BusinessException.missing("Hồ sơ nhà cung cấp"));}
    private Supplier find(Long id){return suppliers.findById(id).orElseThrow(()->BusinessException.missing("Nhà cung cấp"));}
    private SupplierDocument findDocument(Long supplierId,Long documentId){SupplierDocument document=documents.findById(documentId).orElseThrow(()->BusinessException.missing("Giấy tờ"));if(!document.getSupplier().getId().equals(supplierId))throw BusinessException.missing("Giấy tờ");return document;}
    private Supplier findPending(Long id){Supplier s=find(id);if(!"PENDING".equals(s.getStatus()))throw BusinessException.conflict("INVALID_SUPPLIER_STATUS","Hồ sơ không còn chờ duyệt");return s;}
    private void validateType(String type){if(!TYPES.contains(normalize(type)))throw BusinessException.bad("INVALID_SUPPLIER_TYPE","Loại nhà cung cấp không hợp lệ");}
    private String normalize(String value){return value==null?"":value.trim().toUpperCase();}
    private static LocalDate today(){return LocalDate.now(DateRange.ZONE);}
    private boolean blank(String value){return value==null||value.isBlank();}
    private SupplierView view(Supplier s){
        List<DocumentView> docs=documents.findBySupplierId(s.getId()).stream().map(this::documentView).toList();
        return new SupplierView(s.getId(),s.getName(),s.getLocation(),s.getDescription(),s.getDocumentUrl(),s.getStatus(),s.getOwner().getId(),
            s.getOwner().getFullName(),s.getEmail(),s.getPhone(),s.getSupplierType(),s.getRejectionReason(),
            s.getReviewedBy()==null?null:s.getReviewedBy().getId(),s.getReviewedAt(),s.getCreatedAt(),docs);
    }
    private DocumentView documentView(SupplierDocument d){
        String url=d.getObjectKey()==null||d.getObjectKey().isBlank()?d.getFileUrl():storage.readUrl(d.getObjectKey());
        return new DocumentView(d.getId(),d.getType(),d.getDocumentName(),d.getOriginalFileName(),url,d.effectiveStatus(today()).name(),d.getRejectionReason(),d.getUploadedAt(),d.getExpiryDate());
    }
}
