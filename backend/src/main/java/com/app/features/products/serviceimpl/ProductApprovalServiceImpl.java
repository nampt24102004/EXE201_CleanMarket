package com.app.features.products.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.notifications.enums.NotificationType;
import com.app.features.notifications.service.NotificationService;
import com.app.features.products.dto.ProductApprovalControllerDto.*;
import com.app.features.products.dto.PartnerProductControllerDto.*;
import com.app.features.products.entity.*;
import com.app.features.products.repository.*;
import com.app.features.products.service.ProductApprovalService;
import com.app.features.storage.service.StorageService;
import com.app.features.traceability.entity.Certification;
import com.app.features.traceability.enums.CertificationStatus;
import com.app.features.traceability.repository.CertificationRepository;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class ProductApprovalServiceImpl implements ProductApprovalService {
    private final ProductRepository products;private final ProductImageRepository images;private final CertificationRepository certifications;
    private final CurrentUser current;private final AuditService audit;private final StorageService storage;private final NotificationService notifications;
    public ProductApprovalServiceImpl(ProductRepository products,ProductImageRepository images,CertificationRepository certifications,CurrentUser current,AuditService audit,StorageService storage,NotificationService notifications){
        this.products=products;this.images=images;this.certifications=certifications;this.current=current;this.audit=audit;this.storage=storage;this.notifications=notifications;
    }
    @Override public ApiResponse<List<ReviewView>> list(String status){
        List<Product> values=status==null||status.isBlank()||"ALL".equalsIgnoreCase(status)?products.findAll():products.findByApprovalStatus(status.toUpperCase());
        return ApiResponse.ok(values.stream().sorted(Comparator.comparing(Product::getCreatedAt).reversed()).map(this::view).toList());
    }
    @Override public ApiResponse<ReviewView> detail(Long id){return ApiResponse.ok(view(find(id)));}
    @Override @Transactional public ApiResponse<ReviewView> approve(Long id){
        Product p=pending(id);if(!"APPROVED".equals(p.getSupplier().getStatus()))throw BusinessException.bad("SUPPLIER_NOT_APPROVED","Nhà cung cấp chưa được duyệt");
        if(certifications.findByProductIdOrderByCreatedAtAsc(id).stream().anyMatch(c->c.getStatus()==CertificationStatus.PENDING&&!c.expiredOn(LocalDate.now(DateRange.ZONE))))throw BusinessException.conflict("CERTIFICATE_PENDING","Vui lòng duyệt hoặc từ chối các chứng nhận đang chờ trước khi duyệt sản phẩm");
        p.setApprovalStatus("APPROVED");p.setStatus("ACTIVE");p.setRejectionReason(null);p.setReviewedBy(current.get());p.setReviewedAt(Instant.now());products.save(p);
        audit.record(current.get(),"PRODUCT_APPROVED","Product",id,null);
        notifyOwner(p,"Sản phẩm đã được duyệt","Sản phẩm \""+p.getName()+"\" đã được duyệt và đang hiển thị trên CleanMarket.");return ApiResponse.ok(view(p));
    }
    @Override @Transactional public ApiResponse<ReviewView> reject(Long id,RejectRequest request){
        Product p=pending(id);p.setApprovalStatus("REJECTED");p.setStatus("INACTIVE");p.setRejectionReason(request.reason().trim());p.setReviewedBy(current.get());p.setReviewedAt(Instant.now());products.save(p);
        audit.record(current.get(),"PRODUCT_REJECTED","Product",id,request.reason());
        notifyOwner(p,"Sản phẩm bị từ chối","Sản phẩm \""+p.getName()+"\" chưa được duyệt. Lý do: "+request.reason().trim()+"\nVui lòng chỉnh sửa và gửi duyệt lại.");return ApiResponse.ok(view(p));
    }
    @Override @Transactional public ApiResponse<ReviewView> approveCertificate(Long productId,Long certificateId){Certification c=certificate(productId,certificateId);c.setStatus(CertificationStatus.APPROVED);c.setRejectionReason(null);c.setReviewedBy(current.get());c.setReviewedAt(Instant.now());certifications.save(c);audit.record(current.get(),"CERTIFICATE_APPROVED","Certification",c.getId(),null);return detail(productId);}
    @Override @Transactional public ApiResponse<ReviewView> rejectCertificate(Long productId,Long certificateId,RejectRequest request){Certification c=certificate(productId,certificateId);c.setStatus(CertificationStatus.REJECTED);c.setRejectionReason(request.reason().trim());c.setReviewedBy(current.get());c.setReviewedAt(Instant.now());certifications.save(c);audit.record(current.get(),"CERTIFICATE_REJECTED","Certification",c.getId(),request.reason());notifyOwner(c.getProduct(),"Chứng nhận bị từ chối","Chứng nhận "+c.getType()+" số "+c.getCertificateNo()+" của sản phẩm \""+c.getProduct().getName()+"\" bị từ chối. Lý do: "+request.reason().trim());return detail(productId);}
    private void notifyOwner(Product p,String title,String message){notifications.notify(p.getSupplier().getOwner(),NotificationType.PRODUCT,title,message,"/partner/products");}
    private Product find(Long id){return products.findById(id).orElseThrow(()->BusinessException.missing("Sản phẩm"));}
    private Product pending(Long id){Product p=find(id);if(!"PENDING".equals(p.getApprovalStatus()))throw BusinessException.conflict("INVALID_PRODUCT_STATUS","Sản phẩm không còn chờ duyệt");return p;}
    private Certification certificate(Long productId,Long id){Certification c=certifications.findById(id).orElseThrow(()->BusinessException.missing("Chứng nhận"));if(c.getProduct()==null||!c.getProduct().getId().equals(productId))throw BusinessException.missing("Chứng nhận");if(c.expiredOn(LocalDate.now(DateRange.ZONE)))throw BusinessException.conflict("CERTIFICATE_EXPIRED","Chứng nhận đã hết hạn");if(c.getStatus()!=CertificationStatus.PENDING)throw BusinessException.conflict("INVALID_CERTIFICATE_STATUS","Chứng nhận đã được xử lý");return c;}
    private ReviewView view(Product p){return new ReviewView(p.getId(),p.getName(),p.getSupplier().getName(),p.getApprovalStatus(),p.getStatus(),p.getCertificateNo(),p.getPrice(),p.getStock(),p.getUnit(),p.getOrigin(),p.getDescription(),p.getRejectionReason(),images.findByProductIdOrderBySortOrderAsc(p.getId()).stream().map(this::image).toList(),certifications.findByProductIdOrderByCreatedAtAsc(p.getId()).stream().map(this::cert).toList());}
    private ImageView image(ProductImage i){return new ImageView(i.getId(),i.getObjectKey()==null?i.getImageUrl():storage.readUrl(i.getObjectKey()),i.getOriginalFileName(),i.getSortOrder());}
    private CertificateView cert(Certification c){return new CertificateView(c.getId(),c.getType(),c.getCertificateNo(),c.getIssuer(),c.getIssuedAt(),c.getExpiryAt(),c.getObjectKey()==null?c.getFileUrl():storage.readUrl(c.getObjectKey()),c.effectiveStatus(LocalDate.now(DateRange.ZONE)).name(),c.getRejectionReason());}
}
