package com.app.features.catalog.serviceimpl;

import com.app.common.*;
import com.app.features.catalog.dto.CatalogControllerDto.*;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.catalog.service.CatalogService;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.products.repository.ProductImageRepository;
import com.app.features.storage.service.StorageService;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.app.features.traceability.entity.*;
import com.app.features.traceability.enums.CertificationStatus;
import com.app.features.traceability.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class CatalogServiceImpl implements CatalogService {
    private final ProductRepository products;private final SupplierRepository suppliers;private final CategoryRepository categories;private final BatchRepository batches;private final CertificationRepository certifications;private final ProductImageRepository images;private final StorageService storage;
    public CatalogServiceImpl(ProductRepository products,SupplierRepository suppliers,CategoryRepository categories,BatchRepository batches,CertificationRepository certifications,ProductImageRepository images,StorageService storage){this.products=products;this.suppliers=suppliers;this.categories=categories;this.batches=batches;this.certifications=certifications;this.images=images;this.storage=storage;}
    public ApiResponse<List<CategoryView>> categories(){return ApiResponse.ok(categories.findByActiveTrueOrderByNameAsc().stream().map(c->new CategoryView(c.getId(),c.getName())).toList());}
    public ApiResponse<List<SupplierView>> suppliers(){return ApiResponse.ok(suppliers.findByStatus("APPROVED").stream().map(this::supplier).toList());}
    public ApiResponse<SupplierView> supplier(Long id){Supplier s=suppliers.findById(id).filter(x->"APPROVED".equals(x.getStatus())).orElseThrow(()->BusinessException.missing("Nhà cung cấp"));return ApiResponse.ok(supplier(s));}
    public ApiResponse<List<ProductView>> products(String search,Long categoryId,Long supplierId,BigDecimal maxPrice){return ApiResponse.ok(products.findPublic().stream().filter(p->search==null||p.getName().toLowerCase().contains(search.trim().toLowerCase())).filter(p->categoryId==null||p.getCategory().getId().equals(categoryId)).filter(p->supplierId==null||p.getSupplier().getId().equals(supplierId)).filter(p->maxPrice==null||p.getPrice().compareTo(maxPrice)<=0).map(this::product).toList());}
    public ApiResponse<ProductView> product(Long id){Product p=products.findById(id).filter(x->"APPROVED".equals(x.getApprovalStatus())&&"ACTIVE".equals(x.getStatus())&&"APPROVED".equals(x.getSupplier().getStatus())).orElseThrow(()->BusinessException.missing("Sản phẩm"));return ApiResponse.ok(product(p));}
    private SupplierView supplier(Supplier s){return new SupplierView(s.getId(),s.getName(),s.getLocation(),s.getDescription(),s.getStatus());}
    private BatchView batch(ProductBatch b){return new BatchView(b.getId(),b.getBatchCode(),b.getTraceCode(),b.getFarmName(),b.getOrigin(),b.getHarvestDate(),b.getPackagingDate(),b.getExpiryDate(),b.getCertificateNo(),b.getStatus());}
    private ProductView product(Product p){BatchView latest=batches.findFirstByProductIdAndStatusOrderByCreatedAtDesc(p.getId(),"ACTIVE").map(this::batch).orElse(null);
        List<PublicCertificateView> verified=certifications.findByProductIdOrderByCreatedAtAsc(p.getId()).stream().filter(c->c.getStatus()==CertificationStatus.APPROVED).filter(c->c.getExpiryAt()==null||!c.getExpiryAt().isBefore(LocalDate.now())).map(c->new PublicCertificateView(c.getType(),c.getCertificateNo(),c.getIssuer(),c.getExpiryAt())).toList();
        String certificateNo=verified.isEmpty()?null:verified.get(0).certificateNo();
        String image=images.findByProductIdOrderBySortOrderAsc(p.getId()).stream().findFirst().map(i->i.getObjectKey()==null?p.getImageUrl():storage.readUrl(i.getObjectKey())).orElse(p.getImageUrl());
        return new ProductView(p.getId(),p.getName(),p.getDescription(),p.getPrice(),p.getUnit(),image,p.getStock(),new CategoryView(p.getCategory().getId(),p.getCategory().getName()),supplier(p.getSupplier()),certificateNo,latest,p.getOrigin(),verified);
    }
}
