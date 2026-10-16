package com.app.features.promotions.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.promotions.dto.BannerDto.BannerRequest;
import com.app.features.promotions.dto.BannerDto.BannerResponse;
import com.app.features.promotions.entity.PromotionalBanner;
import com.app.features.promotions.repository.PromotionalBannerRepository;
import com.app.features.promotions.service.PromotionalBannerService;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PromotionalBannerServiceImpl implements PromotionalBannerService {

    private final PromotionalBannerRepository bannerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveBanners(String position) {
        Instant now = Instant.now();
        List<PromotionalBanner> banners;
        if (position != null && !position.trim().isEmpty()) {
            banners = bannerRepository.findByPositionAndIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc(position.trim().toUpperCase());
        } else {
            banners = bannerRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
        }

        return banners.stream()
                .filter(b -> (b.getStartDate() == null || !now.isBefore(b.getStartDate())))
                .filter(b -> (b.getEndDate() == null || !now.isAfter(b.getEndDate())))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getAllBanners(String position) {
        List<PromotionalBanner> banners;
        if (position != null && !position.trim().isEmpty()) {
            banners = bannerRepository.findByPositionOrderByDisplayOrderAscCreatedAtDesc(position.trim().toUpperCase());
        } else {
            banners = bannerRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc();
        }
        return banners.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BannerResponse getBannerById(Long id) {
        PromotionalBanner banner = bannerRepository.findById(id)
                .orElseThrow(() -> BusinessException.missing("Banner với mã " + id));
        return toResponse(banner);
    }

    @Override
    public BannerResponse createBanner(BannerRequest req) {
        PromotionalBanner banner = new PromotionalBanner();
        updateEntityFromRequest(banner, req);
        PromotionalBanner saved = bannerRepository.save(banner);
        return toResponse(saved);
    }

    @Override
    public BannerResponse updateBanner(Long id, BannerRequest req) {
        PromotionalBanner banner = bannerRepository.findById(id)
                .orElseThrow(() -> BusinessException.missing("Banner với mã " + id));
        updateEntityFromRequest(banner, req);
        PromotionalBanner saved = bannerRepository.save(banner);
        return toResponse(saved);
    }

    @Override
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw BusinessException.missing("Banner với mã " + id);
        }
        bannerRepository.deleteById(id);
    }

    @Override
    public BannerResponse toggleBannerStatus(Long id) {
        PromotionalBanner banner = bannerRepository.findById(id)
                .orElseThrow(() -> BusinessException.missing("Banner với mã " + id));
        banner.setIsActive(!Boolean.TRUE.equals(banner.getIsActive()));
        PromotionalBanner saved = bannerRepository.save(banner);
        return toResponse(saved);
    }

    private void updateEntityFromRequest(PromotionalBanner banner, BannerRequest req) {
        banner.setTitle(req.getTitle().trim());
        banner.setBadgeText(req.getBadgeText() != null ? req.getBadgeText().trim() : null);
        banner.setLinkUrl(req.getLinkUrl() != null ? req.getLinkUrl().trim() : null);
        banner.setPosition(req.getPosition() != null && !req.getPosition().trim().isEmpty()
                ? req.getPosition().trim().toUpperCase() : "TOP_BAR");
        banner.setThemeStyle(req.getThemeStyle() != null && !req.getThemeStyle().trim().isEmpty()
                ? req.getThemeStyle().trim().toUpperCase() : "ORGANIC_EMERALD");
        banner.setAnimationEffect(req.getAnimationEffect() != null && !req.getAnimationEffect().trim().isEmpty()
                ? req.getAnimationEffect().trim().toUpperCase() : "SLIDE_HORIZONTAL");
        banner.setBgColor(req.getBgColor() != null ? req.getBgColor().trim() : null);
        banner.setTextColor(req.getTextColor() != null && !req.getTextColor().trim().isEmpty()
                ? req.getTextColor().trim() : "#ffffff");
        banner.setHotline(req.getHotline() != null ? req.getHotline().trim() : null);
        banner.setDisplayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0);
        banner.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        banner.setStartDate(req.getStartDate());
        banner.setEndDate(req.getEndDate());
    }

    private BannerResponse toResponse(PromotionalBanner b) {
        return BannerResponse.builder()
                .id(b.getId())
                .title(b.getTitle())
                .badgeText(b.getBadgeText())
                .linkUrl(b.getLinkUrl())
                .position(b.getPosition())
                .themeStyle(b.getThemeStyle())
                .animationEffect(b.getAnimationEffect())
                .bgColor(b.getBgColor())
                .textColor(b.getTextColor())
                .hotline(b.getHotline())
                .displayOrder(b.getDisplayOrder())
                .isActive(b.getIsActive())
                .startDate(b.getStartDate())
                .endDate(b.getEndDate())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
