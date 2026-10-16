package com.app.features.promotions.service;

import com.app.features.promotions.dto.BannerDto.BannerRequest;
import com.app.features.promotions.dto.BannerDto.BannerResponse;
import java.util.List;

public interface PromotionalBannerService {

    List<BannerResponse> getActiveBanners(String position);

    List<BannerResponse> getAllBanners(String position);

    BannerResponse getBannerById(Long id);

    BannerResponse createBanner(BannerRequest req);

    BannerResponse updateBanner(Long id, BannerRequest req);

    void deleteBanner(Long id);

    BannerResponse toggleBannerStatus(Long id);
}
