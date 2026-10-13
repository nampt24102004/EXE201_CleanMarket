USE cleanmarket_db;

CREATE TABLE IF NOT EXISTS shipping_zones (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, zone_code VARCHAR(40) NOT NULL UNIQUE, zone_name VARCHAR(160) NOT NULL,
 address_keywords VARCHAR(1000) NOT NULL, shipping_fee DECIMAL(15,2) NOT NULL,
 free_shipping_threshold DECIMAL(15,2) NULL, active BIT NOT NULL DEFAULT 1,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);
INSERT INTO shipping_zones(zone_code,zone_name,address_keywords,shipping_fee,free_shipping_threshold,active,created_at,updated_at) VALUES
 ('HOA_LAC','Hòa Lạc','Hòa Lạc,Thạch Hòa,Khu Công nghệ cao',15000,300000,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('THACH_THAT_QUOC_OAI','Thạch Thất - Quốc Oai','Thạch Thất,Quốc Oai',25000,500000,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BA_VI_SON_TAY','Ba Vì - Sơn Tây','Ba Vì,Sơn Tây',35000,700000,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE zone_name=VALUES(zone_name),address_keywords=VALUES(address_keywords),shipping_fee=VALUES(shipping_fee),free_shipping_threshold=VALUES(free_shipping_threshold);

ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS name VARCHAR(160) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS scope VARCHAR(20) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS maximum_discount_amount DECIMAL(15,2) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS per_customer_limit INT NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS status VARCHAR(20) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS supplier_id BIGINT NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS created_by BIGINT NULL;
UPDATE vouchers SET name=COALESCE(name,code),scope=COALESCE(scope,'PLATFORM'),per_customer_limit=COALESCE(per_customer_limit,1),status=COALESCE(status,IF(active=1,'ACTIVE','INACTIVE')),created_by=COALESCE(created_by,(SELECT id FROM users WHERE email='admin@cleanmarket.vn' LIMIT 1)) WHERE id>0;
ALTER TABLE voucher_usages ADD COLUMN IF NOT EXISTS status VARCHAR(20) NULL;
UPDATE voucher_usages SET status=COALESCE(status,'REDEEMED') WHERE id>0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS partner_discount DECIMAL(15,2) NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_discount DECIMAL(15,2) NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_discount DECIMAL(15,2) NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zone VARCHAR(160) NULL;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) NULL DEFAULT 0;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS discount DECIMAL(15,2) NULL DEFAULT 0;
UPDATE supplier_orders SET subtotal=total_amount WHERE (subtotal IS NULL OR subtotal=0) AND id>0;
CREATE TABLE IF NOT EXISTS order_vouchers (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,order_id BIGINT NOT NULL,supplier_order_id BIGINT NULL,voucher_id BIGINT NOT NULL,
 code_snapshot VARCHAR(80) NOT NULL,scope_snapshot VARCHAR(20) NOT NULL,discount_type_snapshot VARCHAR(20) NOT NULL,
 discount_value_snapshot DECIMAL(15,2) NOT NULL,discount_amount DECIMAL(15,2) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 UNIQUE KEY uk_order_voucher(order_id,voucher_id),INDEX idx_order_voucher_order(order_id)
);

INSERT INTO vouchers(code,name,description,scope,discount_type,discount_value,maximum_discount_amount,minimum_order_amount,usage_limit,used_count,per_customer_limit,starts_at,expires_at,active,status,supplier_id,created_by,created_at,updated_at) VALUES
 ('CLEAN10','Giảm 10% toàn sàn','Voucher demo CleanMarket','PLATFORM','PERCENTAGE',10,50000,50000,100,0,1,DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 DAY),DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 90 DAY),1,'ACTIVE',NULL,(SELECT id FROM users WHERE email='manager@cleanmarket.vn' LIMIT 1),CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('HOALAC15','Ưu đãi nông trại Hòa Lạc','Voucher demo nhà cung cấp','PARTNER','PERCENTAGE',15,30000,20000,100,0,1,DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 DAY),DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 90 DAY),1,'ACTIVE',(SELECT id FROM suppliers WHERE name LIKE '%Hòa Lạc%' LIMIT 1),(SELECT id FROM users WHERE email='partner1@cleanmarket.vn' LIMIT 1),CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),scope=VALUES(scope),status=VALUES(status),active=VALUES(active);
