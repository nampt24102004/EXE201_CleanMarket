package com.app.features.traceability.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.traceability.dto.TraceControllerDto.BatchRequest;
import com.app.features.traceability.dto.TraceControllerDto.BatchView;
import com.app.features.traceability.dto.TraceControllerDto.TraceView;
import com.app.features.traceability.entity.ProductBatch;
import com.app.features.traceability.repository.BatchRepository;
import com.app.features.traceability.service.TraceService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.MultiFormatWriter;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly = true)
public class TraceServiceImpl implements TraceService {
    private final BatchRepository batches; private final ProductRepository products; private final CurrentUser current; private final AuditService audit;
    @Value("${app.frontend.base-url}") private String frontendBaseUrl;
    public TraceServiceImpl(BatchRepository batches, ProductRepository products, CurrentUser current, AuditService audit) { this.batches = batches; this.products = products; this.current = current; this.audit = audit; }
    @Transactional public ApiResponse<BatchView> create(Long productId, @Valid BatchRequest request) {
        Product p = ownedProduct(productId);
        if (!"APPROVED".equals(p.getApprovalStatus()) || !"ACTIVE".equals(p.getStatus()) || !"APPROVED".equals(p.getSupplier().getStatus())) throw BusinessException.bad("PRODUCT_NOT_ACTIVE", "Sản phẩm hoặc nhà cung cấp chưa được duyệt");
        if (request.packagingDate().isBefore(request.harvestDate()) || request.expiryDate() != null && request.expiryDate().isBefore(request.packagingDate()) || request.expiryDate() != null && request.expiryDate().isBefore(LocalDate.now())) throw BusinessException.bad("INVALID_BATCH_DATES", "Ngày của lô hàng không hợp lệ");
        ProductBatch batch = new ProductBatch(); batch.setProduct(p); batch.setBatchCode("CM-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase()); batch.setTraceCode(UUID.randomUUID().toString().replace("-", "")); batch.setFarmName(request.farmName().trim()); batch.setOrigin(request.origin().trim()); batch.setHarvestDate(request.harvestDate()); batch.setPackagingDate(request.packagingDate()); batch.setExpiryDate(request.expiryDate()); batch.setQuantity(request.quantity()); batch.setCertificateNo(request.certificateNo()); batches.save(batch);
        p.setStock(p.getStock().add(request.quantity())); products.save(p); audit.record(current.get(), "BATCH_CREATE", "ProductBatch", batch.getId(), batch.getBatchCode()); return ApiResponse.ok(view(batch));
    }
    public ApiResponse<List<BatchView>> mine(Long productId) { ownedProduct(productId); return ApiResponse.ok(batches.findByProductIdOrderByCreatedAtDesc(productId).stream().map(this::view).toList()); }
    public ResponseEntity<byte[]> qr(Long id) throws Exception {
        ProductBatch batch = batches.findById(id).orElseThrow(() -> BusinessException.missing("Lô hàng")); ownedProduct(batch.getProduct().getId());
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(); MatrixToImageWriter.writeToStream(new MultiFormatWriter().encode(url(batch), BarcodeFormat.QR_CODE, 400, 400), "PNG", bytes);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(bytes.toByteArray());
    }
    public ApiResponse<TraceView> trace(String traceCode) {
        ProductBatch b = batches.findByTraceCode(traceCode).orElseThrow(() -> BusinessException.missing("Mã truy xuất")); Product p = b.getProduct();
        String status = b.getExpiryDate() != null && b.getExpiryDate().isBefore(LocalDate.now()) ? "EXPIRED" : b.getStatus();
        return ApiResponse.ok(new TraceView(b.getTraceCode(), b.getBatchCode(), status, p.getName(), p.getImageUrl(), p.getSupplier().getName(), p.getSupplier().getStatus(), b.getFarmName(), b.getOrigin(), b.getHarvestDate(), b.getPackagingDate(), b.getExpiryDate(), b.getCertificateNo()));
    }
    private Product ownedProduct(Long id) { Product p = products.findById(id).orElseThrow(() -> BusinessException.missing("Sản phẩm")); if (!p.getSupplier().getOwner().getId().equals(current.get().getId())) throw BusinessException.forbidden(); return p; }
    private String url(ProductBatch b) { return frontendBaseUrl.replaceAll("/$", "") + "/trace/" + b.getTraceCode(); }
    private BatchView view(ProductBatch b) { return new BatchView(b.getId(), b.getProduct().getId(), b.getBatchCode(), b.getTraceCode(), b.getFarmName(), b.getOrigin(), b.getHarvestDate(), b.getPackagingDate(), b.getExpiryDate(), b.getQuantity(), b.getCertificateNo(), b.getStatus(), url(b)); }
}
