package com.app.features.promotions.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class BannerDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BannerRequest {
        @NotBlank(message = "Tiêu đề thông điệp khuyến mãi không được để trống")
        private String title;
        private String badgeText;
        private String linkUrl;
        private String position;
        private String themeStyle;
        private String animationEffect;
        private String bgColor;
        private String textColor;
        private String hotline;
        private Integer displayOrder;
        private Boolean isActive;
        private Instant startDate;
        private Instant endDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BannerResponse {
        private Long id;
        private String title;
        private String badgeText;
        private String linkUrl;
        private String position;
        private String themeStyle;
        private String animationEffect;
        private String bgColor;
        private String textColor;
        private String hotline;
        private Integer displayOrder;
        private Boolean isActive;
        private Instant startDate;
        private Instant endDate;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
