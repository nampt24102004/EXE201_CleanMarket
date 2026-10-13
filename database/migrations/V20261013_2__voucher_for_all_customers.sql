USE cleanmarket_db;

-- Đồng bộ các voucher đã tồn tại với quy tắc hiện tại:
-- mọi khách hàng đều có thể dùng và mỗi tài khoản chỉ dùng từng mã một lần.
UPDATE vouchers
SET new_customer_only = 0,
    per_customer_limit = 1
WHERE id > 0;
