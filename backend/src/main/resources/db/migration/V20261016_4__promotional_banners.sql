-- Promotional banners table with design themes and visual effects
USE cleanmarket_db;

CREATE TABLE IF NOT EXISTS promotional_banners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    badge_text VARCHAR(100) NULL,
    link_url VARCHAR(255) NULL,
    position VARCHAR(50) NOT NULL DEFAULT 'TOP_BAR',
    theme_style VARCHAR(50) NOT NULL DEFAULT 'ORGANIC_EMERALD',
    animation_effect VARCHAR(50) NOT NULL DEFAULT 'SLIDE_HORIZONTAL',
    bg_color VARCHAR(100) NULL,
    text_color VARCHAR(50) NULL DEFAULT '#ffffff',
    hotline VARCHAR(50) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO promotional_banners (title, badge_text, link_url, position, theme_style, animation_effect, hotline, display_order, is_active)
VALUES 
('Miễn phí vận chuyển theo ngưỡng từng khu vực • Cam kết 100% tươi sạch chuẩn VietGAP', 'Ưu đãi hôm nay', '/products', 'TOP_BAR', 'ORGANIC_EMERALD', 'BOUNCE_BADGE', '0358 755 719', 1, TRUE),
('Nhập mã CLEANFREESHIP giảm ngay 15.000đ phí giao hàng cho đơn từ 150.000đ', 'Freeship 15K', '/products', 'TOP_BAR', 'SUNSET_ORANGE', 'PULSE_GLOW', '0358 755 719', 2, TRUE),
('Nông sản thu hoạch sớm trong ngày - Giao siêu tốc 2H khu vực nội thành', 'Giao 2 Giờ', '/products', 'TOP_BAR', 'ROYAL_GOLD', 'SLIDE_HORIZONTAL', '0358 755 719', 3, TRUE);
