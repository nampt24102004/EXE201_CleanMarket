package com.app.features.promotions.controller;

import com.app.common.ApiResponse;
import com.app.features.promotions.dto.BannerDto.BannerResponse;
import com.app.features.promotions.service.PromotionalBannerService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/banners")
@RequiredArgsConstructor
public class PublicBannerController {

    private final PromotionalBannerService bannerService;

    @GetMapping
    public ApiResponse<List<BannerResponse>> getActiveBanners(
            @RequestParam(required = false) String position) {
        return ApiResponse.ok(bannerService.getActiveBanners(position));
    }
}
