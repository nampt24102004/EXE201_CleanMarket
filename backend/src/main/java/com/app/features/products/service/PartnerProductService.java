package com.app.features.products.service;

import com.app.common.ApiResponse;
import com.app.features.products.dto.PartnerProductControllerDto.*;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface PartnerProductService {
    ApiResponse<List<ProductView>> mine();
    ApiResponse<ProductView> get(Long id);
    ApiResponse<ProductView> create(ProductRequest request);
    ApiResponse<ProductView> update(Long id,ProductRequest request);
    ApiResponse<List<ImageView>> uploadImages(Long id,List<MultipartFile> files);
    ApiResponse<CertificateView> uploadCertificate(Long id,String type,String number,String issuer,LocalDate issuedDate,LocalDate expiryDate,MultipartFile file);
    ApiResponse<ProductView> deleteCertificate(Long id,Long certificateId);
    ApiResponse<ProductView> submit(Long id);
}
