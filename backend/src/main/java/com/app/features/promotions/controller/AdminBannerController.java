package com.app.features.promotions.controller;

import com.app.common.ApiResponse;
import com.app.features.promotions.dto.BannerDto.BannerRequest;
import com.app.features.promotions.dto.BannerDto.BannerResponse;
import com.app.features.promotions.service.PromotionalBannerService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/admin/banners", "/api/manager/banners"})
@RequiredArgsConstructor
public class AdminBannerController {

    private final PromotionalBannerService bannerService;

    @GetMapping
    public ApiResponse<List<BannerResponse>> getAllBanners(
            @RequestParam(required = false) String position) {
        return ApiResponse.ok(bannerService.getAllBanners(position));
    }

    @GetMapping("/{id}")
    public ApiResponse<BannerResponse> getBannerById(@PathVariable Long id) {
        return ApiResponse.ok(bannerService.getBannerById(id));
    }

    @PostMapping
    public ApiResponse<BannerResponse> createBanner(@Valid @RequestBody BannerRequest req) {
        return ApiResponse.ok(bannerService.createBanner(req), "Tạo banner khuyến mãi thành công");
    }

    @PutMapping("/{id}")
    public ApiResponse<BannerResponse> updateBanner(
            @PathVariable Long id,
            @Valid @RequestBody BannerRequest req) {
        return ApiResponse.ok(bannerService.updateBanner(id, req), "Cập nhật banner khuyến mãi thành công");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ApiResponse.ok(null, "Xóa banner thành công");
    }

    @PatchMapping("/{id}/toggle")
    public ApiResponse<BannerResponse> toggleBannerStatus(@PathVariable Long id) {
        return ApiResponse.ok(bannerService.toggleBannerStatus(id), "Chuyển trạng thái banner thành công");
    }
}
