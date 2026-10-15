-- Keep the runtime migration copy synchronized with database/migrations.
-- CleanMarket admin, voucher and shipping schema upgrade for MySQL 8.
-- Safe to re-run: existing columns, indexes and foreign keys are detected first.
USE cleanmarket_db;

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
    SET @cm_sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_definition);
    PREPARE cm_stmt FROM @cm_sql;
    EXECUTE cm_stmt;
    DEALLOCATE PREPARE cm_stmt;
  END IF;
END//
DELIMITER ;

CALL cm_add_column_if_missing('users', 'locked', "BIT(1) NOT NULL DEFAULT b'0'");
CALL cm_add_column_if_missing('orders', 'partner_discount', 'DECIMAL(15,2) NULL');
CALL cm_add_column_if_missing('orders', 'platform_discount', 'DECIMAL(15,2) NULL');
CALL cm_add_column_if_missing('orders', 'shipping_discount', 'DECIMAL(15,2) NULL');
CALL cm_add_column_if_missing('orders', 'shipping_zone', 'VARCHAR(160) NULL');
CALL cm_add_column_if_missing('supplier_orders', 'subtotal', 'DECIMAL(15,2) NULL');
CALL cm_add_column_if_missing('supplier_orders', 'discount', 'DECIMAL(15,2) NULL');
CALL cm_add_column_if_missing('vouchers', 'name', 'VARCHAR(160) NULL');
CALL cm_add_column_if_missing('vouchers', 'scope', "ENUM('PLATFORM','PARTNER') NULL");
CALL cm_add_column_if_missing('vouchers', 'maximum_discount_amount', 'DECIMAL(15,2) NULL');
CALL cm_add_column_if_missing('vouchers', 'per_customer_limit', 'INT NULL');
CALL cm_add_column_if_missing('vouchers', 'new_customer_only', "BIT(1) NOT NULL DEFAULT b'0'");
CALL cm_add_column_if_missing('vouchers', 'status', "ENUM('DRAFT','ACTIVE','INACTIVE','EXPIRED') NULL");
CALL cm_add_column_if_missing('vouchers', 'supplier_id', 'BIGINT NULL');
CALL cm_add_column_if_missing('vouchers', 'created_by', 'BIGINT NULL');
CALL cm_add_column_if_missing('voucher_usages', 'status', "ENUM('RESERVED','REDEEMED','RELEASED') NULL");
DROP PROCEDURE cm_add_column_if_missing;

UPDATE orders SET partner_discount=COALESCE(partner_discount,0), platform_discount=COALESCE(platform_discount,discount,0), shipping_discount=COALESCE(shipping_discount,0);
UPDATE supplier_orders SET subtotal=COALESCE(subtotal,total_amount), discount=COALESCE(discount,0);
UPDATE vouchers SET name=COALESCE(NULLIF(name,''),code), scope=COALESCE(scope,'PLATFORM'), per_customer_limit=COALESCE(per_customer_limit,1), new_customer_only=COALESCE(new_customer_only,b'0'), status=COALESCE(status,IF(active=b'1','ACTIVE','INACTIVE'));
UPDATE voucher_usages SET status=COALESCE(status,'REDEEMED');

CREATE TABLE IF NOT EXISTS shipping_zones (
  id BIGINT NOT NULL AUTO_INCREMENT, zone_code VARCHAR(40) NOT NULL, zone_name VARCHAR(160) NOT NULL,
  address_keywords VARCHAR(1000) NOT NULL, shipping_fee DECIMAL(15,2) NOT NULL,
  free_shipping_threshold DECIMAL(15,2) NULL, active BIT(1) NOT NULL,
  created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NULL, PRIMARY KEY (id),
  CONSTRAINT uk_shipping_zones_zone_code UNIQUE (zone_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_vouchers (
  id BIGINT NOT NULL AUTO_INCREMENT, order_id BIGINT NOT NULL, supplier_order_id BIGINT NULL,
  voucher_id BIGINT NOT NULL, code_snapshot VARCHAR(80) NOT NULL, scope_snapshot VARCHAR(20) NOT NULL,
  discount_type_snapshot VARCHAR(20) NOT NULL, discount_value_snapshot DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) NOT NULL, created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NULL,
  PRIMARY KEY (id), CONSTRAINT uk_order_vouchers_order_voucher UNIQUE (order_id,voucher_id),
  CONSTRAINT fk_order_vouchers_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_vouchers_supplier_order FOREIGN KEY (supplier_order_id) REFERENCES supplier_orders(id),
  CONSTRAINT fk_order_vouchers_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS cm_add_fk_if_missing;
DELIMITER //
CREATE PROCEDURE cm_add_fk_if_missing(IN p_table_name VARCHAR(64), IN p_constraint_name VARCHAR(64), IN p_definition VARCHAR(1000))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema=DATABASE() AND table_name=p_table_name
      AND constraint_name=p_constraint_name AND constraint_type='FOREIGN KEY'
  ) THEN
    SET @cm_sql=CONCAT('ALTER TABLE `',p_table_name,'` ADD CONSTRAINT `',p_constraint_name,'` ',p_definition);
    PREPARE cm_stmt FROM @cm_sql;
    EXECUTE cm_stmt;
    DEALLOCATE PREPARE cm_stmt;
  END IF;
END//
DELIMITER ;
CALL cm_add_fk_if_missing('vouchers','fk_vouchers_supplier','FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)');
CALL cm_add_fk_if_missing('vouchers','fk_vouchers_created_by','FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)');
DROP PROCEDURE cm_add_fk_if_missing;

SELECT 'CleanMarket V5 admin/voucher/shipping migration completed' AS result;
