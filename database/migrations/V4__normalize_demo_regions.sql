-- Normalize existing CleanMarket demo records to the supported service area.
-- This migration only targets the known demo accounts and preserves uploaded images.
USE cleanmarket_db;

SET @CM_OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;
START TRANSACTION;

UPDATE suppliers s
JOIN users u ON u.id = s.owner_id
SET s.name = CASE LOWER(u.email)
      WHEN 'partner1@cleanmarket.vn' THEN 'Nông trại Rau sạch Hòa Lạc'
      WHEN 'partner@cleanmarket.vn' THEN 'Nông trại Rau sạch Hòa Lạc'
      WHEN 'partner2@cleanmarket.vn' THEN 'Nông trại Ba Vì Xanh'
      WHEN 'applicant@cleanmarket.vn' THEN 'Hợp tác xã Nông nghiệp Thạch Thất'
      ELSE s.name
    END,
    s.location = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN 'Hòa Lạc, Thạch Thất, Hà Nội'
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN 'Ba Vì, Hà Nội'
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN 'Thạch Thất, Hà Nội'
      ELSE s.location
    END,
    s.description = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN 'Rau củ sạch từ vùng trồng Hòa Lạc - Thạch Thất, Hà Nội.'
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN 'Nông sản sạch từ vùng trồng Ba Vì, Hà Nội.'
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN 'Nông sản từ khu vực Thạch Thất, Hà Nội.'
      ELSE s.description
    END
WHERE LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn', 'partner2@cleanmarket.vn', 'applicant@cleanmarket.vn');

UPDATE products p
JOIN suppliers s ON s.id = p.supplier_id
JOIN users u ON u.id = s.owner_id
SET p.name = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN REPLACE(p.name, 'Đà Lạt', 'Hòa Lạc')
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN REPLACE(REPLACE(p.name, 'Mộc Châu', 'Ba Vì'), 'Sơn La', 'Ba Vì')
      ELSE p.name
    END,
    p.description = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN CONCAT(REPLACE(REPLACE(COALESCE(p.name, 'Nông sản'), 'Đà Lạt', 'Hòa Lạc'), 'Lâm Đồng', 'Hòa Lạc'), ' từ vùng trồng Hòa Lạc - Thạch Thất, Hà Nội.')
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN CONCAT(REPLACE(REPLACE(COALESCE(p.name, 'Nông sản'), 'Mộc Châu', 'Ba Vì'), 'Sơn La', 'Ba Vì'), ' từ vùng trồng Ba Vì, Hà Nội.')
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN CONCAT(COALESCE(p.name, 'Nông sản'), ' từ vùng trồng Thạch Thất, Hà Nội.')
      ELSE p.description
    END,
    p.origin = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN 'Hòa Lạc, Thạch Thất, Hà Nội'
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN 'Ba Vì, Hà Nội'
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN 'Thạch Thất, Hà Nội'
      ELSE p.origin
    END
WHERE LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn', 'partner2@cleanmarket.vn', 'applicant@cleanmarket.vn');

UPDATE product_batches b
JOIN products p ON p.id = b.product_id
JOIN suppliers s ON s.id = p.supplier_id
JOIN users u ON u.id = s.owner_id
SET b.farm_name = s.name,
    b.origin = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN 'Hòa Lạc, Thạch Thất, Hà Nội'
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN 'Ba Vì, Hà Nội'
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN 'Thạch Thất, Hà Nội'
      ELSE b.origin
    END
WHERE LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn', 'partner2@cleanmarket.vn', 'applicant@cleanmarket.vn');

UPDATE trace_events e
JOIN product_batches b ON b.id = e.batch_id
JOIN products p ON p.id = b.product_id
JOIN suppliers s ON s.id = p.supplier_id
JOIN users u ON u.id = s.owner_id
SET e.location = b.origin
WHERE LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn', 'partner2@cleanmarket.vn', 'applicant@cleanmarket.vn');

UPDATE notifications
SET message = 'Hợp tác xã Nông nghiệp Thạch Thất đang chờ xét duyệt.'
WHERE id = 2602;

COMMIT;
SET SQL_SAFE_UPDATES = @CM_OLD_SQL_SAFE_UPDATES;

