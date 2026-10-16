package com.app.features.promotions.entity;

import com.app.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "promotional_banners")
@Getter
@Setter
public class PromotionalBanner extends BaseEntity {

    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "badge_text", length = 100)
    private String badgeText;

    @Column(name = "link_url", length = 255)
    private String linkUrl;

    @Column(nullable = false, length = 50)
    private String position = "TOP_BAR";

    @Column(name = "theme_style", nullable = false, length = 50)
    private String themeStyle = "ORGANIC_EMERALD";

    @Column(name = "animation_effect", nullable = false, length = 50)
    private String animationEffect = "SLIDE_HORIZONTAL";

    @Column(name = "bg_color", length = 100)
    private String bgColor;

    @Column(name = "text_color", length = 50)
    private String textColor = "#ffffff";

    @Column(length = 50)
    private String hotline;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;
}
