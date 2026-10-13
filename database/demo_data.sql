-- CleanMarket demo data for MySQL 8 / Hibernate schema.
-- Geographic scope: Hoa Lac - Thach That - Ba Vi, Ha Noi.
-- Supplier/farm names and certificates in this seed file are DEMO DATA for the academic project.
-- Safe to run repeatedly after the backend has created its tables; existing demo rows are preserved.
-- Do not enable DEMO_SEED or configure BOOTSTRAP_ADMIN_EMAIL for the same demo accounts.
-- All dates for produce batches are relative to the day this file is imported.
CREATE DATABASE IF NOT EXISTS cleanmarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cleanmarket_db;
SET NAMES utf8mb4;
START TRANSACTION;

-- Tai khoan demo. Mat khau chung: Demo@123456 (BCrypt).
INSERT IGNORE INTO users (id, email, password_hash, full_name, phone, role, enabled, created_at, updated_at) VALUES
  (101, 'user@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Phạm Tiến Nam', '0912345678', 'USER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (102, 'partner1@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Trần Bình', '0912345679', 'PARTNER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (103, 'partner2@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Lê Chi', '0912345680', 'PARTNER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (104, 'manager@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Trần Đình Toàn', '0912345681', 'MANAGER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (105, 'admin@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Võ Hà', '0912345682', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (106, 'applicant@cleanmarket.vn', '$2a$10$6SJkmj9KFLtRp7FhXg0BW.IyMYO9DAc3DTL1kq5YJTZCShFsFqhI2', 'Đỗ Mai', '0912345683', 'USER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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

-- Don da giao COD, don PAYOS cho thanh toan, don COD hai Partner, don PAYOS da thanh toan.
INSERT IGNORE INTO orders (id, user_id, order_code, subtotal, discount, shipping_fee, total_amount, status, payment_method, full_name, phone, address, note, created_at, updated_at) VALUES
  (1401, 101, 'CM-DEMO-COD-DELIVERED', 65000, 0, 0, 65000, 'DELIVERED', 'COD', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Đơn đã giao', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1402, 101, 'CM-DEMO-PAYOS-PENDING', 30000, 0, 0, 30000, 'CREATED', 'PAYOS', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Có thể gọi API tạo URL PAYOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1403, 101, 'CM-DEMO-MULTI-SUPPLIER', 70000, 0, 0, 70000, 'CREATED', 'COD', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Một đơn, hai nhà cung cấp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1404, 101, 'CM-DEMO-PAYOS-PAID', 60000, 5000, 0, 55000, 'PAID', 'PAYOS', 'Nguyễn An', '0912345678', 'Khu CNC Hòa Lạc, Thạch Hòa, Thạch Thất, Hà Nội', 'Dữ liệu lịch sử có voucher', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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

-- Thanh toan COD va PAYOS.
INSERT IGNORE INTO payments (id, order_id, provider, status, amount, txn_ref, provider_transaction_no, response_code, paid_at, created_at, updated_at) VALUES
  (1701, 1401, 'COD', 'PAID', 65000, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1702, 1402, 'PAYOS', 'PENDING', 30000, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1703, 1403, 'COD', 'PENDING', 70000, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1704, 1404, 'PAYOS', 'PAID', 55000, 'CMDEMO20260922PAID', 'DEMO-TXN-001', '00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Log PAYOS lich su; khong dung giao dich mau nay de goi IPN.
INSERT IGNORE INTO payment_transactions (id, payment_id, event_type, request_payload, response_payload, signature_valid, response_code, provider_transaction_no, created_at, updated_at) VALUES
  (1801, 1704, 'IPN', '{"vnp_TxnRef":"CMDEMO20260922PAID","vnp_ResponseCode":"00"}', '{"RspCode":"00","Message":"Confirm Success"}', 1, '00', 'DEMO-TXN-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Lich su trang thai don.
INSERT IGNORE INTO order_status_history (id, order_id, status, actor_user_id, note, created_at, updated_at) VALUES
  (1901, 1401, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1902, 1401, 'DELIVERED', 102, 'Đã giao cho khách', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1903, 1402, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1904, 1403, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1905, 1404, 'CREATED', 101, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1906, 1404, 'PAID', NULL, 'PAYOS IPN đã xác thực', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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

-- Lich su su dung voucher tren don PAYOS da thanh toan.
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
