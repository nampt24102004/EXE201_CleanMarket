package com.app.features.products.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.products.dto.PartnerProductControllerDto.*;
import com.app.features.products.entity.*;
import com.app.features.products.repository.*;
import com.app.features.products.service.PartnerProductService;
import com.app.features.storage.service.StorageService;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.app.features.traceability.entity.Certification;
import com.app.features.traceability.enums.CertificationStatus;
import com.app.features.traceability.repository.CertificationRepository;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service @Transactional(readOnly=true)
public class PartnerProductServiceImpl implements PartnerProductService {
    private static final Set<String> IMAGE_EXT=Set.of("jpg","jpeg","png");
    private static final Set<String> DOC_EXT=Set.of("pdf","jpg","jpeg","png");
    private static final Set<String> CERT_TYPES=Set.of("VIETGAP","ORGANIC","OCOP","FOOD_SAFETY","OTHER");
    private final ProductRepository products; private final ProductImageRepository images; private final SupplierRepository suppliers;
    private final CategoryRepository categories; private final CertificationRepository certifications; private final CurrentUser current;
    private final AuditService audit; private final StorageService storage; private final int maxFiles;
    public PartnerProductServiceImpl(ProductRepository products,ProductImageRepository images,SupplierRepository suppliers,
        CategoryRepository categories,CertificationRepository certifications,CurrentUser current,AuditService audit,
        StorageService storage,@Value("${app.upload.max-files:8}") int maxFiles){
        this.products=products;this.images=images;this.suppliers=suppliers;this.categories=categories;this.certifications=certifications;
        this.current=current;this.audit=audit;this.storage=storage;this.maxFiles=maxFiles;
    }
    @Override public ApiResponse<List<ProductView>> mine(){Supplier s=approvedSupplier();return ApiResponse.ok(products.findBySupplierId(s.getId()).stream().map(this::view).toList());}
    @Override public ApiResponse<ProductView> get(Long id){return ApiResponse.ok(view(ownedProduct(id)));}
    @Override @Transactional public ApiResponse<ProductView> create(ProductRequest request){
        Supplier s=approvedSupplier();Product p=new Product();p.setSupplier(s);fill(p,request);p.setApprovalStatus("DRAFT");p.setStatus("INACTIVE");products.save(p);
        audit.record(current.get(),"PRODUCT_CREATED","Product",p.getId(),null);return ApiResponse.ok(view(p));
    }
    @Override @Transactional public ApiResponse<ProductView> update(Long id,ProductRequest request){
        Product p=ownedProduct(id);if("APPROVED".equals(p.getApprovalStatus()))throw BusinessException.conflict("INVALID_PRODUCT_STATUS","Sản phẩm đã duyệt không thể sửa");
        fill(p,request);p.setApprovalStatus("DRAFT");p.setRejectionReason(null);p.setReviewedAt(null);p.setReviewedBy(null);products.save(p);
        return ApiResponse.ok(view(p));
    }
    @Override @Transactional public ApiResponse<List<ImageView>> uploadImages(Long id,List<MultipartFile> files){
        Product p=editable(id);if(files==null||files.isEmpty()||files.size()>maxFiles)throw BusinessException.bad("INVALID_DOCUMENT","Số lượng ảnh không hợp lệ");
        List<ProductImage> existing=images.findByProductIdOrderBySortOrderAsc(id);if(existing.size()+files.size()>maxFiles)throw BusinessException.bad("INVALID_DOCUMENT","Đã vượt quá số ảnh cho phép");
        int sort=existing.size();for(MultipartFile f:files){var stored=storage.upload(f,"products/"+id+"/images",IMAGE_EXT);ProductImage img=new ProductImage();
            img.setProduct(p);img.setImageUrl(stored.fileUrl());img.setObjectKey(stored.objectKey());img.setOriginalFileName(stored.originalFileName());img.setSortOrder(sort++);images.save(img);
            if(p.getImageUrl()==null||p.getImageUrl().isBlank())p.setImageUrl(stored.fileUrl());}
        return ApiResponse.ok(images.findByProductIdOrderBySortOrderAsc(id).stream().map(this::imageView).toList());
    }
    @Override @Transactional public ApiResponse<CertificateView> uploadCertificate(Long id,String type,String number,String issuer,LocalDate issued,LocalDate expiry,MultipartFile file){
        Product p=editable(id);String normalized=type==null?"":type.trim().toUpperCase();if(!CERT_TYPES.contains(normalized))throw BusinessException.bad("INVALID_DOCUMENT","Loại chứng nhận không hợp lệ");
        if(number==null||number.isBlank()||issuer==null||issuer.isBlank())throw BusinessException.bad("INVALID_DOCUMENT","Thiếu thông tin chứng nhận");
        if(expiry!=null&&issued!=null&&expiry.isBefore(issued))throw BusinessException.bad("INVALID_DOCUMENT","Ngày hết hạn không hợp lệ");
        if(expiry!=null&&expiry.isBefore(LocalDate.now(com.app.common.DateRange.ZONE)))throw BusinessException.bad("CERTIFICATE_EXPIRED","Chứng nhận đã hết hạn, vui lòng tải bản còn hiệu lực");
        var stored=storage.upload(file,"products/"+id+"/certificates",DOC_EXT);Certification c=new Certification();c.setProduct(p);c.setType(normalized);c.setCertificateNo(number.trim());
        c.setIssuer(issuer.trim());c.setIssuedAt(issued);c.setExpiryAt(expiry);c.setObjectKey(stored.objectKey());c.setFileUrl(stored.fileUrl());c.setStatus(CertificationStatus.PENDING);certifications.save(c);
        audit.record(current.get(),"CERTIFICATE_UPLOADED","Certification",c.getId(),normalized);return ApiResponse.ok(certificateView(c));
    }
    /** Rejected or expired certificates can always be withdrawn; anything else only while the product is still editable. */
    @Override @Transactional public ApiResponse<ProductView> deleteCertificate(Long id,Long certificateId){
        Product p=ownedProduct(id);Certification c=certifications.findById(certificateId).filter(x->x.getProduct()!=null&&x.getProduct().getId().equals(id)).orElseThrow(()->BusinessException.missing("Chứng nhận"));
        boolean withdrawable=c.getStatus()==CertificationStatus.REJECTED||c.expiredOn(LocalDate.now(com.app.common.DateRange.ZONE))||Set.of("DRAFT","REJECTED").contains(p.getApprovalStatus());
        if(!withdrawable)throw BusinessException.conflict("CERTIFICATE_LOCKED","Chỉ xóa được chứng nhận bị từ chối/hết hạn, hoặc khi sản phẩm đang ở bản nháp");
        certifications.delete(c);storage.delete(c.getObjectKey());audit.record(current.get(),"CERTIFICATE_DELETED","Certification",certificateId,c.getType());return ApiResponse.ok(view(p));
    }
    @Override @Transactional public ApiResponse<ProductView> submit(Long id){
        Product p=editable(id);if(!Set.of("DRAFT","REJECTED").contains(p.getApprovalStatus()))throw BusinessException.conflict("INVALID_PRODUCT_STATUS","Sản phẩm không thể gửi duyệt");
        if(images.findByProductIdOrderBySortOrderAsc(id).isEmpty()&&(p.getImageUrl()==null||p.getImageUrl().isBlank()))throw BusinessException.bad("INVALID_DOCUMENT","Sản phẩm cần ít nhất một ảnh");
        p.setApprovalStatus("PENDING");p.setStatus("INACTIVE");p.setRejectionReason(null);products.save(p);audit.record(current.get(),"PRODUCT_SUBMITTED","Product",id,null);return ApiResponse.ok(view(p));
    }
    private Product editable(Long id){Product p=ownedProduct(id);if(!Set.of("DRAFT","REJECTED").contains(p.getApprovalStatus()))throw BusinessException.conflict("INVALID_PRODUCT_STATUS","Sản phẩm không thể chỉnh sửa");return p;}
    private Supplier approvedSupplier(){Supplier s=suppliers.findByOwnerId(current.get().getId()).orElseThrow(()->BusinessException.bad("NOT_APPROVED_PARTNER","Không có hồ sơ nhà cung cấp"));if(!"APPROVED".equals(s.getStatus()))throw BusinessException.bad("NOT_APPROVED_PARTNER","Nhà cung cấp chưa được phê duyệt");return s;}
    private Product ownedProduct(Long id){Product p=products.findById(id).orElseThrow(()->BusinessException.missing("Sản phẩm"));if(!p.getSupplier().getOwner().getId().equals(current.get().getId()))throw new BusinessException("PRODUCT_NOT_OWNED_BY_PARTNER","Sản phẩm không thuộc nhà cung cấp của bạn",org.springframework.http.HttpStatus.FORBIDDEN);approvedSupplier();return p;}
    private void fill(Product p,ProductRequest r){Category c=categories.findById(r.categoryId()).filter(Category::isActive).orElseThrow(()->BusinessException.missing("Danh mục"));p.setCategory(c);p.setName(r.name().trim());p.setDescription(r.description());p.setPrice(r.price());p.setUnit(r.unit().trim());p.setImageUrl(r.imageUrl());p.setCertificateNo(r.certificateNo());p.setStock(r.stock());p.setOrigin(r.origin().trim());}
    private ProductView view(Product p){return new ProductView(p.getId(),p.getName(),p.getPrice(),p.getUnit(),p.getApprovalStatus(),p.getStatus(),p.getStock(),p.getOrigin(),p.getDescription(),p.getCategory().getId(),p.getCategory().getName(),p.getImageUrl(),p.getRejectionReason(),images.findByProductIdOrderBySortOrderAsc(p.getId()).stream().map(this::imageView).toList(),certifications.findByProductIdOrderByCreatedAtAsc(p.getId()).stream().map(this::certificateView).toList(),p.getCreatedAt());}
    private ImageView imageView(ProductImage i){String url=i.getObjectKey()==null?i.getImageUrl():storage.readUrl(i.getObjectKey());return new ImageView(i.getId(),url,i.getOriginalFileName(),i.getSortOrder());}
    private CertificateView certificateView(Certification c){String url=c.getObjectKey()==null?c.getFileUrl():storage.readUrl(c.getObjectKey());return new CertificateView(c.getId(),c.getType(),c.getCertificateNo(),c.getIssuer(),c.getIssuedAt(),c.getExpiryAt(),url,c.effectiveStatus(LocalDate.now(com.app.common.DateRange.ZONE)).name(),c.getRejectionReason());}
}
