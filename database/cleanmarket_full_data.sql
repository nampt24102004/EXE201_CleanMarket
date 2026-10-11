-- CleanMarket full database setup for MySQL 8.
-- Run AFTER Spring Boot has started once with JPA_DDL_AUTO=update so all tables exist.
-- This file combines schema upgrades, demo data, role backfill and demo image synchronization.
-- Existing rows are preserved; demo inserts use INSERT IGNORE.

CREATE DATABASE IF NOT EXISTS cleanmarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cleanmarket_db;
SET NAMES utf8mb4;

-- MySQL Workbench may enable Safe Updates and reject required data backfills.
-- Preserve the current session setting, disable it for this script, then restore it at the end.
SET @CM_OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- ============================================================
-- 1. Schema upgrades: payOS, Supplier/Partner and Product approval
-- ============================================================
-- MySQL 8 does not provide portable ADD COLUMN IF NOT EXISTS syntax.
-- Check INFORMATION_SCHEMA before adding each column.
DROP PROCEDURE IF EXISTS cm_add_column_if_missing;
DELIMITER //
CREATE PROCEDURE cm_add_column_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_column_name VARCHAR(64),
  IN p_definition VARCHAR(1000)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND column_name = p_column_name
  ) THEN
    SET @cm_column_sql = CONCAT(
      'ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_definition
    );
    PREPARE cm_column_stmt FROM @cm_column_sql;
    EXECUTE cm_column_stmt;
    DEALLOCATE PREPARE cm_column_stmt;
  END IF;
END//
DELIMITER ;

CALL cm_add_column_if_missing('payments', 'provider_order_code', 'BIGINT NULL');
CALL cm_add_column_if_missing('payments', 'provider_payment_link_id', 'VARCHAR(100) NULL');
CALL cm_add_column_if_missing('payments', 'checkout_url', 'VARCHAR(1000) NULL');
CALL cm_add_column_if_missing('payments', 'qr_code', 'TEXT NULL');
CALL cm_add_column_if_missing('payments', 'expires_at', 'DATETIME(6) NULL');

CALL cm_add_column_if_missing('suppliers', 'email', 'VARCHAR(190) NULL');
CALL cm_add_column_if_missing('suppliers', 'phone', 'VARCHAR(30) NULL');
CALL cm_add_column_if_missing('suppliers', 'supplier_type', 'VARCHAR(40) NULL');
CALL cm_add_column_if_missing('suppliers', 'rejection_reason', 'VARCHAR(1000) NULL');
CALL cm_add_column_if_missing('suppliers', 'reviewed_by', 'BIGINT NULL');
CALL cm_add_column_if_missing('suppliers', 'reviewed_at', 'DATETIME(6) NULL');

CALL cm_add_column_if_missing('supplier_documents', 'document_name', 'VARCHAR(255) NULL');
CALL cm_add_column_if_missing('supplier_documents', 'original_file_name', 'VARCHAR(255) NULL');
CALL cm_add_column_if_missing('supplier_documents', 'object_key', 'VARCHAR(500) NULL');
CALL cm_add_column_if_missing('supplier_documents', 'rejection_reason', 'VARCHAR(1000) NULL');
CALL cm_add_column_if_missing('supplier_documents', 'reviewed_by', 'BIGINT NULL');
CALL cm_add_column_if_missing('supplier_documents', 'reviewed_at', 'DATETIME(6) NULL');
CALL cm_add_column_if_missing('supplier_documents', 'uploaded_at', 'DATETIME(6) NULL');

CALL cm_add_column_if_missing('products', 'origin', 'VARCHAR(255) NULL');
CALL cm_add_column_if_missing('products', 'rejection_reason', 'VARCHAR(1000) NULL');
CALL cm_add_column_if_missing('products', 'reviewed_by', 'BIGINT NULL');
CALL cm_add_column_if_missing('products', 'reviewed_at', 'DATETIME(6) NULL');

CALL cm_add_column_if_missing('product_images', 'object_key', 'VARCHAR(500) NULL');
CALL cm_add_column_if_missing('product_images', 'original_file_name', 'VARCHAR(255) NULL');

CALL cm_add_column_if_missing('certifications', 'issuer', 'VARCHAR(160) NULL');
CALL cm_add_column_if_missing('certifications', 'object_key', 'VARCHAR(500) NULL');
CALL cm_add_column_if_missing('certifications', 'rejection_reason', 'VARCHAR(1000) NULL');
CALL cm_add_column_if_missing('certifications', 'reviewed_by', 'BIGINT NULL');
CALL cm_add_column_if_missing('certifications', 'reviewed_at', 'DATETIME(6) NULL');

DROP PROCEDURE cm_add_column_if_missing;

UPDATE suppliers s JOIN users u ON u.id = s.owner_id
SET s.email = COALESCE(s.email, u.email),
    s.phone = COALESCE(NULLIF(s.phone, ''), COALESCE(u.phone, 'Chưa cập nhật')),
    s.supplier_type = COALESCE(NULLIF(s.supplier_type, ''), 'OTHER');

ALTER TABLE suppliers
  MODIFY email VARCHAR(190) NOT NULL,
  MODIFY phone VARCHAR(30) NOT NULL,
  MODIFY supplier_type VARCHAR(40) NOT NULL;

UPDATE supplier_documents
SET document_name = COALESCE(NULLIF(document_name, ''), type),
    original_file_name = COALESCE(NULLIF(original_file_name, ''), CONCAT('legacy-document-', id)),
    uploaded_at = COALESCE(uploaded_at, created_at);

ALTER TABLE supplier_documents
  MODIFY document_name VARCHAR(255) NOT NULL,
  MODIFY original_file_name VARCHAR(255) NOT NULL;

UPDATE products p JOIN suppliers s ON s.id = p.supplier_id
SET p.origin = COALESCE(NULLIF(p.origin, ''), s.location),
    p.approval_status = CASE
      WHEN p.approval_status = 'PENDING_APPROVAL' THEN 'PENDING'
      ELSE p.approval_status
    END;

ALTER TABLE products MODIFY origin VARCHAR(255) NOT NULL;

-- MySQL has no portable CREATE INDEX IF NOT EXISTS, so guard each index via INFORMATION_SCHEMA.
DROP PROCEDURE IF EXISTS cm_add_index_if_missing;
DELIMITER $$
CREATE PROCEDURE cm_add_index_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_columns VARCHAR(255),
  IN p_unique BOOLEAN
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND index_name = p_index_name
  ) THEN
    SET @cm_index_sql = CONCAT(
      'CREATE ', IF(p_unique, 'UNIQUE ', ''),
      'INDEX `', p_index_name, '` ON `', p_table_name, '` (', p_columns, ')'
    );
    PREPARE cm_stmt FROM @cm_index_sql;
    EXECUTE cm_stmt;
    DEALLOCATE PREPARE cm_stmt;
  END IF;
END$$
DELIMITER ;

CALL cm_add_index_if_missing('payments', 'uk_payments_provider_order_code', '`provider_order_code`', TRUE);
CALL cm_add_index_if_missing('payment_transactions', 'idx_payment_transactions_provider_txn', '`provider_transaction_no`', FALSE);
CALL cm_add_index_if_missing('suppliers', 'idx_suppliers_status_created', '`status`,`created_at`', FALSE);
CALL cm_add_index_if_missing('products', 'idx_products_approval_created', '`approval_status`,`created_at`', FALSE);
CALL cm_add_index_if_missing('certifications', 'idx_certifications_product_status', '`product_id`,`status`', FALSE);
CALL cm_add_index_if_missing('supplier_documents', 'uk_supplier_documents_object_key', '`object_key`', TRUE);
CALL cm_add_index_if_missing('product_images', 'uk_product_images_object_key', '`object_key`', TRUE);
CALL cm_add_index_if_missing('certifications', 'uk_certifications_object_key', '`object_key`', TRUE);
DROP PROCEDURE cm_add_index_if_missing;

-- ============================================================
-- 2. Demo data
-- ============================================================
START TRANSACTION;

-- Tai khoan demo. Mat khau chung: Demo@123456 (BCrypt).
INSERT IGNORE INTO users (id, email, password_hash, full_name, phone, role, enabled, created_at, updated_at) VALUES
  (101, 'user@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Đỗ Mai', '0912345678', 'USER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (102, 'partner1@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Trần Bình', '0912345679', 'PARTNER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (103, 'partner2@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Lê Chi', '0912345680', 'PARTNER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (104, 'manager@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Trần Đình Toàn', '0912345681', 'MANAGER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (105, 'admin@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Võ Hà', '0912345682', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (106, 'applicant@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Phạm Tiến Nam', '0912345683', 'USER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vai tro va quyen mau; he thong hien doc users.role de phan quyen.
INSERT IGNORE INTO roles (id, name, description, created_at, updated_at) VALUES
  (201, 'USER', 'Khách hàng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (202, 'PARTNER', 'Nhà cung cấp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (203, 'MANAGER', 'Quản lý vận hành', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (204, 'ADMIN', 'Quản trị hệ thống', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Quyen mau.
INSERT IGNORE INTO permissions (id, code, description, created_at, updated_at) VALUES
  (301, 'PRODUCT_VIEW', 'Xem sản phẩm', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (302, 'PRODUCT_MANAGE', 'Quản lý sản phẩm', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (303, 'ORDER_MANAGE', 'Xử lý đơn hàng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (304, 'SUPPLIER_APPROVE', 'Duyệt nhà cung cấp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (305, 'USER_MANAGE', 'Quản lý tài khoản', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Gan vai tro cho tai khoan.
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
  (101, 201),
  (102, 202),
  (103, 202),
  (104, 203),
  (105, 204),
  (106, 201);

-- Gan quyen cho vai tro.
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (201, 301),
  (202, 301),
  (202, 302),
  (202, 303),
  (203, 301),
  (203, 303),
  (203, 304),
  (204, 301),
  (204, 302),
  (204, 303),
  (204, 304),
  (204, 305);

-- Dia chi giao hang.
INSERT IGNORE INTO addresses (id, user_id, recipient_name, phone, address_line, is_default, created_at, updated_at) VALUES
  (401, 101, 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (402, 101, 'Nguyễn An', '0912345678', 'Thị trấn Tây Đằng, Ba Vì, Hà Nội', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Ho so nha cung cap: hai duyet, mot cho duyet.
INSERT IGNORE INTO suppliers (id, owner_id, name, location, email, phone, supplier_type, description, status, document_url, created_at, updated_at) VALUES
  (501, 102, 'Nông trại Rau sạch Hòa Lạc', 'Thạch Hòa, Thạch Thất, Hà Nội', 'partner1@cleanmarket.vn', '0912345679', 'FARM', 'Nông trại demo cung cấp rau củ canh tác tại khu vực Hòa Lạc - Thạch Thất.', 'APPROVED', 'https://placehold.co/800x600?text=Supplier+Document', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (502, 103, 'Nông trại Ba Vì Xanh', 'Ba Vì, Hà Nội', 'partner2@cleanmarket.vn', '0912345680', 'FARM', 'Nông trại demo cung cấp nông sản và trái cây có nguồn gốc tại khu vực Ba Vì, Hà Nội.', 'APPROVED', 'https://placehold.co/800x600?text=Supplier+Document', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (503, 106, 'Hợp tác xã Nông nghiệp Thạch Thất', 'Thạch Thất, Hà Nội', 'applicant@cleanmarket.vn', '0912345683', 'COOPERATIVE', 'Nhà cung cấp demo tại khu vực Thạch Thất, hồ sơ đang chờ Manager xét duyệt.', 'PENDING', 'https://placehold.co/800x600?text=Pending+Document', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Tai lieu nha cung cap.
INSERT IGNORE INTO supplier_documents (id, supplier_id, type, document_name, original_file_name, file_url, status, expiry_date, uploaded_at, created_at, updated_at) VALUES
  (601, 501, 'BUSINESS_LICENSE', 'Giấy phép kinh doanh', 'business-license-demo.pdf', 'https://placehold.co/800x600?text=Business+License', 'APPROVED', DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (602, 503, 'BUSINESS_LICENSE', 'Giấy phép kinh doanh', 'pending-license-demo.pdf', 'https://placehold.co/800x600?text=Pending+License', 'PENDING', DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- CategoryBootstrap có thể đã tạo bốn danh mục này khi ứng dụng khởi động.
INSERT IGNORE INTO categories (name, slug, active, created_at, updated_at)
SELECT 'Rau lá', 'rau-la', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Rau lá');
INSERT IGNORE INTO categories (name, slug, active, created_at, updated_at)
SELECT 'Củ quả', 'cu-qua', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Củ quả');
INSERT IGNORE INTO categories (name, slug, active, created_at, updated_at)
SELECT 'Trái cây', 'trai-cay', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Trái cây');
INSERT IGNORE INTO categories (name, slug, active, created_at, updated_at)
SELECT 'Thực phẩm khác', 'thuc-pham-khac', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Thực phẩm khác');
UPDATE categories SET slug = CASE name
    WHEN 'Rau lá' THEN 'rau-la'
    WHEN 'Củ quả' THEN 'cu-qua'
    WHEN 'Trái cây' THEN 'trai-cay'
    WHEN 'Thực phẩm khác' THEN 'thuc-pham-khac'
    ELSE slug END
WHERE name IN ('Rau lá', 'Củ quả', 'Trái cây', 'Thực phẩm khác') AND slug IS NULL;

-- San pham public va mot san pham cho Manager duyet.
INSERT IGNORE INTO products (id, supplier_id, category_id, name, description, price, unit, image_url, stock, origin, approval_status, status, certificate_no, version, created_at, updated_at) VALUES
  (701, 501, (SELECT id FROM categories WHERE name = 'Củ quả'), 'Cà rốt', 'Cà rốt tươi từ vùng trồng Hòa Lạc - Thạch Thất, Hà Nội.', 25000, 'kg', 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80', 100, 'Thạch Hòa, Thạch Thất, Hà Nội', 'APPROVED', 'ACTIVE', 'CM-CERT-001', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (702, 501, (SELECT id FROM categories WHERE name = 'Rau lá'), 'Rau cải xanh', 'Rau cải xanh thu hoạch trong ngày tại khu vực Hòa Lạc - Thạch Thất.', 15000, 'kg', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80', 80, 'Thạch Hòa, Thạch Thất, Hà Nội', 'APPROVED', 'ACTIVE', 'CM-CERT-002', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (703, 502, (SELECT id FROM categories WHERE name = 'Củ quả'), 'Cà chua', 'Cà chua từ vùng trồng Ba Vì, Hà Nội.', 30000, 'kg', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80', 60, 'Ba Vì, Hà Nội', 'APPROVED', 'ACTIVE', 'CM-CERT-003', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (704, 502, (SELECT id FROM categories WHERE name = 'Trái cây'), 'Bưởi', 'Bưởi từ khu vực Ba Vì, Hà Nội, vị thanh và mọng nước.', 45000, 'kg', 'https://placehold.co/900x700?text=Buoi+Ba+Vi', 40, 'Ba Vì, Hà Nội', 'APPROVED', 'ACTIVE', 'CM-CERT-004', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (705, 502, (SELECT id FROM categories WHERE name = 'Rau lá'), 'Rau xà lách', 'Rau xà lách từ khu vực Ba Vì, Hà Nội, đang chờ Manager duyệt.', 22000, 'kg', 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=900&q=80', 20, 'Ba Vì, Hà Nội', 'PENDING', 'INACTIVE', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Anh san pham bo sung.
INSERT IGNORE INTO product_images (id, product_id, image_url, sort_order, created_at, updated_at) VALUES
  (801, 701, 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80+1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (802, 702, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (803, 703, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80+1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (804, 704, 'https://placehold.co/900x700?text=Buoi+Ba+Vi', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Lo san pham va traceCode de mo trang QR.
INSERT IGNORE INTO product_batches (id, product_id, batch_code, trace_code, farm_name, origin, harvest_date, packaging_date, expiry_date, quantity, certificate_no, status, created_at, updated_at) VALUES
  (901, 701, 'CM-HL-CARROT', 'CM-HL-CARROT-001', 'Nông trại Rau sạch Hòa Lạc', 'Thạch Hòa, Thạch Thất, Hà Nội', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 100, 'CM-CERT-001', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (902, 702, 'CM-HL-GREENS', 'CM-HL-GREENS-001', 'Nông trại Rau sạch Hòa Lạc', 'Thạch Hòa, Thạch Thất, Hà Nội', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 80, 'CM-CERT-002', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (903, 703, 'CM-BV-TOMATO', 'CM-BV-TOMATO-001', 'Nông trại Ba Vì Xanh', 'Ba Vì, Hà Nội', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 60, 'CM-CERT-003', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (904, 704, 'CM-BV-POMELO', 'CM-BV-POMELO-001', 'Nông trại Ba Vì Xanh', 'Ba Vì, Hà Nội', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 40, 'CM-CERT-004', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Chung nhan theo supplier hoac batch.
INSERT IGNORE INTO certifications (id, supplier_id, product_id, batch_id, type, certificate_no, issued_at, expiry_at, file_url, status, created_at, updated_at) VALUES
  (1001, 501, NULL, NULL, 'VIETGAP', 'VG-SUP-001', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), 'https://placehold.co/800x600?text=VietGAP', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1002, NULL, NULL, 903, 'QUALITY', 'QC-BATCH-003', DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), 'https://placehold.co/800x600?text=Quality', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Timeline truy xuat nguon goc.
INSERT IGNORE INTO trace_events (id, batch_id, event_type, event_time, location, description, actor_user_id, created_at, updated_at) VALUES
  (1101, 901, 'HARVESTED', CURRENT_TIMESTAMP, 'Thạch Hòa, Thạch Thất, Hà Nội', 'Thu hoạch cà rốt tại vùng trồng Hòa Lạc.', 102, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1102, 901, 'PACKAGED', CURRENT_TIMESTAMP, 'Hòa Lạc, Thạch Thất, Hà Nội', 'Sơ chế và đóng gói tại khu vực Hòa Lạc.', 102, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1103, 903, 'QUALITY_CHECKED', CURRENT_TIMESTAMP, 'Ba Vì, Hà Nội', 'Kiểm tra chất lượng cà chua tại điểm sơ chế Ba Vì.', 103, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Gio hang cho User demo.
INSERT IGNORE INTO carts (id, user_id, created_at, updated_at) VALUES
  (1201, 101, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- San pham trong gio; co the test checkout.
INSERT IGNORE INTO cart_items (id, cart_id, user_id, product_id, quantity, created_at, updated_at) VALUES
  (1301, 1201, 101, 703, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Don da giao COD, don VNPAY cho thanh toan, don COD hai Partner, don VNPAY da thanh toan.
INSERT IGNORE INTO orders (id, user_id, order_code, subtotal, discount, shipping_fee, total_amount, status, payment_method, full_name, phone, address, note, created_at, updated_at) VALUES
  (1401, 101, 'CM-DEMO-COD-DELIVERED', 65000, 0, 0, 65000, 'DELIVERED', 'COD', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Đơn đã giao', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1402, 101, 'CM-DEMO-VNPAY-PENDING', 30000, 0, 0, 30000, 'CREATED', 'VNPAY', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Có thể gọi API tạo URL VNPAY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1403, 101, 'CM-DEMO-MULTI-SUPPLIER', 70000, 0, 0, 70000, 'CREATED', 'COD', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Một đơn, hai nhà cung cấp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1404, 101, 'CM-DEMO-VNPAY-PAID', 60000, 5000, 0, 55000, 'PAID', 'VNPAY', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Dữ liệu lịch sử có voucher', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Phan don theo nha cung cap.
INSERT IGNORE INTO supplier_orders (id, order_id, supplier_id, total_amount, status, created_at, updated_at) VALUES
  (1501, 1401, 501, 65000, 'DELIVERED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1502, 1402, 502, 30000, 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1503, 1403, 501, 25000, 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1504, 1403, 502, 45000, 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1505, 1404, 502, 60000, 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Snapshot san pham trong don.
INSERT IGNORE INTO order_items (id, supplier_order_id, product_id, batch_id, product_name_snapshot, unit_price, unit, quantity, total_amount, created_at, updated_at) VALUES
  (1601, 1501, 701, 901, 'Cà rốt', 25000, 'kg', 2, 50000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1602, 1501, 702, 902, 'Rau cải xanh', 15000, 'kg', 1, 15000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1603, 1502, 703, 903, 'Cà chua', 30000, 'kg', 1, 30000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1604, 1503, 701, 901, 'Cà rốt', 25000, 'kg', 1, 25000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1605, 1504, 704, 904, 'Bưởi', 45000, 'kg', 1, 45000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1606, 1505, 703, 903, 'Cà chua', 30000, 'kg', 2, 60000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Thanh toan COD va VNPAY.
INSERT IGNORE INTO payments (id, order_id, provider, status, amount, txn_ref, provider_transaction_no, response_code, paid_at, created_at, updated_at) VALUES
  (1701, 1401, 'COD', 'PAID', 65000, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1702, 1402, 'VNPAY', 'PENDING', 30000, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1703, 1403, 'COD', 'PENDING', 70000, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1704, 1404, 'VNPAY', 'PAID', 55000, 'CMDEMO20260922PAID', 'DEMO-TXN-001', '00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Log VNPAY lich su; khong dung giao dich mau nay de goi IPN.
INSERT IGNORE INTO payment_transactions (id, payment_id, event_type, request_payload, response_payload, signature_valid, response_code, provider_transaction_no, created_at, updated_at) VALUES
  (1801, 1704, 'IPN', '{"vnp_TxnRef":"CMDEMO20260922PAID","vnp_ResponseCode":"00"}', '{"RspCode":"00","Message":"Confirm Success"}', 1, '00', 'DEMO-TXN-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Lich su trang thai don.
INSERT IGNORE INTO order_status_history (id, order_id, status, actor_user_id, note, created_at, updated_at) VALUES
  (1901, 1401, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1902, 1401, 'DELIVERED', 102, 'Đã giao cho khách', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1903, 1402, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1904, 1403, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1905, 1404, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1906, 1404, 'PAID', NULL, 'VNPAY IPN đã xác thực', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Danh gia tu don da giao.
INSERT IGNORE INTO reviews (id, user_id, order_item_id, product_id, supplier_id, rating, comment, created_at, updated_at) VALUES
  (2001, 101, 1601, 701, 501, 5, 'Cà rốt tươi, đóng gói cẩn thận.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Khieu nai va yeu cau hoan tien thu cong.
INSERT IGNORE INTO complaints (id, user_id, order_id, reason, description, status, resolution, created_at, updated_at) VALUES
  (2101, 101, 1401, 'Sản phẩm dập', 'Một phần rau bị dập khi nhận hàng.', 'RESOLVED', 'Đồng ý hoàn một phần tiền.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Bang chung khieu nai.
INSERT IGNORE INTO complaint_evidence (id, complaint_id, file_url, description, created_at, updated_at) VALUES
  (2201, 2101, 'https://placehold.co/800x600?text=Complaint+Evidence', 'Ảnh sản phẩm khi nhận.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Refund REQUESTED de Manager demo xu ly thu cong.
INSERT IGNORE INTO refunds (id, complaint_id, payment_id, amount, status, note, provider_ref, created_at, updated_at) VALUES
  (2301, 2101, 1701, 10000, 'REQUESTED', 'Chờ hoàn tiền thủ công', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Voucher mau; API checkout hien chua ap dung voucher.
INSERT IGNORE INTO vouchers (id, code, description, discount_type, discount_value, minimum_order_amount, usage_limit, used_count, starts_at, expires_at, active, created_at, updated_at) VALUES
  (2401, 'CLEAN5K', 'Giảm 5.000đ cho đơn từ 50.000đ.', 'FIXED_AMOUNT', 5000, 50000, 100, 1, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2402, 'CLEAN10', 'Giảm 10% cho đơn từ 100.000đ.', 'PERCENTAGE', 10, 100000, 50, 0, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Lich su su dung voucher tren don VNPAY da thanh toan.
INSERT IGNORE INTO voucher_usages (id, voucher_id, user_id, order_id, discount_amount, created_at, updated_at) VALUES
  (2501, 2401, 101, 1404, 5000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Thong bao mau.
INSERT IGNORE INTO notifications (id, recipient_user_id, type, title, message, read_at, created_at, updated_at) VALUES
  (2601, 101, 'ORDER', 'Đơn hàng đã giao', 'Đơn CM-DEMO-COD-DELIVERED đã giao thành công.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2602, 104, 'SUPPLIER', 'Hồ sơ nhà cung cấp chờ duyệt', 'Hợp tác xã Nông nghiệp Thạch Thất đang chờ xét duyệt.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Audit log mau.
INSERT IGNORE INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, detail, old_value, new_value, created_at, updated_at) VALUES
  (2701, 104, 'SUPPLIER_APPROVED', 'Supplier', 501, 'Duyệt hồ sơ Nông trại Rau sạch Hòa Lạc', 'PENDING', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2702, 103, 'PRODUCT_SUBMIT', 'Product', 705, 'Gửi sản phẩm mới chờ duyệt', 'DRAFT', 'PENDING_APPROVAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Cau hinh mau; chua duoc API doc.
INSERT IGNORE INTO system_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES
  (2801, 'support_email', 'support@cleanmarket.vn', 'Email hỗ trợ khách hàng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2802, 'demo_mode', 'true', 'Dữ liệu minh họa cho môi trường local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;

-- ============================================================
-- 3. RBAC backfill for existing and demo users
-- ============================================================
INSERT INTO roles(name, description, created_at, updated_at)
SELECT 'USER', 'Khách hàng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE UPPER(name) = 'USER');

INSERT INTO roles(name, description, created_at, updated_at)
SELECT 'PARTNER', 'Nhà cung cấp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE UPPER(name) = 'PARTNER');

INSERT IGNORE INTO user_roles(user_id, role_id)
SELECT u.id, r.id
FROM users u JOIN roles r ON UPPER(r.name) = 'USER'
WHERE UPPER(u.role) IN ('USER', 'PARTNER');

INSERT IGNORE INTO user_roles(user_id, role_id)
SELECT u.id, r.id
FROM users u JOIN roles r ON UPPER(r.name) = 'PARTNER'
WHERE UPPER(u.role) = 'PARTNER';

-- ============================================================
-- 4. Normalize existing demo records to Hoa Lac/Thach That/Ba Vi
-- ============================================================
UPDATE suppliers s
JOIN users u ON u.id = s.owner_id
SET s.name = CASE LOWER(u.email)
      WHEN 'partner1@cleanmarket.vn' THEN 'Nông trại Rau sạch Hòa Lạc'
      WHEN 'partner@cleanmarket.vn' THEN 'Nông trại Rau sạch Hòa Lạc'
      WHEN 'partner2@cleanmarket.vn' THEN 'Nông trại Ba Vì Xanh'
      WHEN 'applicant@cleanmarket.vn' THEN 'Hợp tác xã Nông nghiệp Thạch Thất'
      ELSE s.name END,
    s.location = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN 'Hòa Lạc, Thạch Thất, Hà Nội'
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN 'Ba Vì, Hà Nội'
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN 'Thạch Thất, Hà Nội'
      ELSE s.location END,
    s.description = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN 'Rau củ sạch từ vùng trồng Hòa Lạc - Thạch Thất, Hà Nội.'
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN 'Nông sản sạch từ vùng trồng Ba Vì, Hà Nội.'
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN 'Nông sản từ khu vực Thạch Thất, Hà Nội.'
      ELSE s.description END
WHERE LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn', 'partner2@cleanmarket.vn', 'applicant@cleanmarket.vn');

UPDATE products p
JOIN suppliers s ON s.id = p.supplier_id
JOIN users u ON u.id = s.owner_id
SET p.name = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN REPLACE(p.name, 'Đà Lạt', 'Hòa Lạc')
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN REPLACE(REPLACE(p.name, 'Mộc Châu', 'Ba Vì'), 'Sơn La', 'Ba Vì')
      ELSE p.name END,
    p.description = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN CONCAT(REPLACE(REPLACE(COALESCE(p.name, 'Nông sản'), 'Đà Lạt', 'Hòa Lạc'), 'Lâm Đồng', 'Hòa Lạc'), ' từ vùng trồng Hòa Lạc - Thạch Thất, Hà Nội.')
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN CONCAT(REPLACE(REPLACE(COALESCE(p.name, 'Nông sản'), 'Mộc Châu', 'Ba Vì'), 'Sơn La', 'Ba Vì'), ' từ vùng trồng Ba Vì, Hà Nội.')
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN CONCAT(COALESCE(p.name, 'Nông sản'), ' từ vùng trồng Thạch Thất, Hà Nội.')
      ELSE p.description END,
    p.origin = CASE
      WHEN LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn') THEN 'Hòa Lạc, Thạch Thất, Hà Nội'
      WHEN LOWER(u.email) = 'partner2@cleanmarket.vn' THEN 'Ba Vì, Hà Nội'
      WHEN LOWER(u.email) = 'applicant@cleanmarket.vn' THEN 'Thạch Thất, Hà Nội'
      ELSE p.origin END
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
      ELSE b.origin END
WHERE LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn', 'partner2@cleanmarket.vn', 'applicant@cleanmarket.vn');

UPDATE trace_events e
JOIN product_batches b ON b.id = e.batch_id
JOIN products p ON p.id = b.product_id
JOIN suppliers s ON s.id = p.supplier_id
JOIN users u ON u.id = s.owner_id
SET e.location = b.origin
WHERE LOWER(u.email) IN ('partner1@cleanmarket.vn', 'partner@cleanmarket.vn', 'partner2@cleanmarket.vn', 'applicant@cleanmarket.vn');

-- ============================================================
-- 5. Restore demo product images only when missing/placeholder
-- ============================================================
UPDATE products
SET image_url = CASE id
  WHEN 701 THEN 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80'
  WHEN 702 THEN 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80'
  WHEN 703 THEN 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'
  WHEN 704 THEN 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=900&q=80'
  WHEN 705 THEN 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=900&q=80'
END
WHERE id IN (701, 702, 703, 704, 705)
  AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE 'https://placehold.co/%');

UPDATE product_images
SET image_url = CASE product_id
  WHEN 701 THEN 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80'
  WHEN 702 THEN 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80'
  WHEN 703 THEN 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'
  WHEN 704 THEN 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=900&q=80'
END
WHERE product_id IN (701, 702, 703, 704)
  AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE 'https://placehold.co/%');

SET SQL_SAFE_UPDATES = @CM_OLD_SQL_SAFE_UPDATES;
SELECT 'CleanMarket database setup completed' AS result;
