USE cleanmarket_db;

ALTER TABLE vouchers
    ADD COLUMN IF NOT EXISTS new_customer_only BIT NOT NULL DEFAULT 0;

INSERT INTO vouchers (
    code, name, description, scope, discount_type, discount_value,
    maximum_discount_amount, minimum_order_amount, usage_limit, used_count,
    per_customer_limit, starts_at, expires_at, active, status,
    supplier_id, created_by, new_customer_only, created_at, updated_at
) VALUES
    ('CMNEW1','Ưu đãi CleanMarket','Áp dụng cho mọi khách hàng; mỗi tài khoản sử dụng một lần.','PLATFORM','PERCENTAGE',20,50000,50000,1000,0,1,DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 DAY),DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 365 DAY),1,'ACTIVE',NULL,(SELECT id FROM users WHERE email='manager@cleanmarket.vn' LIMIT 1),0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
    ('HELLO2','Quà tặng mua sắm','Áp dụng cho mọi khách hàng; mỗi tài khoản sử dụng một lần.','PLATFORM','FIXED_AMOUNT',30000,NULL,100000,1000,0,1,DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 DAY),DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 365 DAY),1,'ACTIVE',NULL,(SELECT id FROM users WHERE email='manager@cleanmarket.vn' LIMIT 1),0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
    ('FRESH3','Ưu đãi trải nghiệm CleanMarket','Áp dụng cho mọi khách hàng; mỗi tài khoản sử dụng một lần.','PLATFORM','PERCENTAGE',15,40000,50000,1000,0,1,DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 DAY),DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 365 DAY),1,'ACTIVE',NULL,(SELECT id FROM users WHERE email='manager@cleanmarket.vn' LIMIT 1),0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description), discount_type=VALUES(discount_type),
    discount_value=VALUES(discount_value), maximum_discount_amount=VALUES(maximum_discount_amount),
    minimum_order_amount=VALUES(minimum_order_amount), per_customer_limit=1, new_customer_only=0,
    status='ACTIVE', active=1;
