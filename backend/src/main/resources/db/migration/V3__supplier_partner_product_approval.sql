-- CleanMarket Supplier/Partner Registration & Product Approval migration.
-- MySQL 8. Run once after selecting cleanmarket_db. No existing rows are deleted.
USE cleanmarket_db;

ALTER TABLE suppliers
  ADD COLUMN email VARCHAR(190) NULL,
  ADD COLUMN phone VARCHAR(30) NULL,
  ADD COLUMN supplier_type VARCHAR(40) NULL,
  ADD COLUMN rejection_reason VARCHAR(1000) NULL,
  ADD COLUMN reviewed_by BIGINT NULL,
  ADD COLUMN reviewed_at DATETIME(6) NULL;

UPDATE suppliers s JOIN users u ON u.id=s.owner_id
SET s.email=COALESCE(s.email,u.email),
    s.phone=COALESCE(NULLIF(s.phone,''),COALESCE(u.phone,'Chưa cập nhật')),
    s.supplier_type=COALESCE(NULLIF(s.supplier_type,''),'OTHER');

ALTER TABLE suppliers
  MODIFY email VARCHAR(190) NOT NULL,
  MODIFY phone VARCHAR(30) NOT NULL,
  MODIFY supplier_type VARCHAR(40) NOT NULL;

ALTER TABLE supplier_documents
  ADD COLUMN document_name VARCHAR(255) NULL,
  ADD COLUMN original_file_name VARCHAR(255) NULL,
  ADD COLUMN object_key VARCHAR(500) NULL,
  ADD COLUMN rejection_reason VARCHAR(1000) NULL,
  ADD COLUMN reviewed_by BIGINT NULL,
  ADD COLUMN reviewed_at DATETIME(6) NULL,
  ADD COLUMN uploaded_at DATETIME(6) NULL;

UPDATE supplier_documents SET
  document_name=COALESCE(NULLIF(document_name,''),type),
  original_file_name=COALESCE(NULLIF(original_file_name,''),CONCAT('legacy-document-',id)),
  uploaded_at=COALESCE(uploaded_at,created_at);

ALTER TABLE supplier_documents
  MODIFY document_name VARCHAR(255) NOT NULL,
  MODIFY original_file_name VARCHAR(255) NOT NULL;

ALTER TABLE products
  ADD COLUMN origin VARCHAR(255) NULL,
  ADD COLUMN rejection_reason VARCHAR(1000) NULL,
  ADD COLUMN reviewed_by BIGINT NULL,
  ADD COLUMN reviewed_at DATETIME(6) NULL;

UPDATE products p JOIN suppliers s ON s.id=p.supplier_id
SET p.origin=COALESCE(NULLIF(p.origin,''),s.location),
    p.approval_status=CASE WHEN p.approval_status='PENDING_APPROVAL' THEN 'PENDING' ELSE p.approval_status END;
ALTER TABLE products MODIFY origin VARCHAR(255) NOT NULL;

ALTER TABLE product_images
  ADD COLUMN object_key VARCHAR(500) NULL,
  ADD COLUMN original_file_name VARCHAR(255) NULL;

ALTER TABLE certifications
  ADD COLUMN issuer VARCHAR(160) NULL,
  ADD COLUMN object_key VARCHAR(500) NULL,
  ADD COLUMN rejection_reason VARCHAR(1000) NULL,
  ADD COLUMN reviewed_by BIGINT NULL,
  ADD COLUMN reviewed_at DATETIME(6) NULL;

INSERT INTO roles(name,description,created_at,updated_at)
SELECT 'USER','Khách hàng',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE UPPER(name)='USER');
INSERT INTO roles(name,description,created_at,updated_at)
SELECT 'PARTNER','Nhà cung cấp',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE UPPER(name)='PARTNER');

INSERT IGNORE INTO user_roles(user_id,role_id)
SELECT u.id,r.id FROM users u JOIN roles r ON UPPER(r.name)='USER'
WHERE UPPER(u.role) IN ('USER','PARTNER');
INSERT IGNORE INTO user_roles(user_id,role_id)
SELECT u.id,r.id FROM users u JOIN roles r ON UPPER(r.name)='PARTNER'
WHERE UPPER(u.role)='PARTNER';

CREATE INDEX idx_suppliers_status_created ON suppliers(status,created_at);
CREATE INDEX idx_products_approval_created ON products(approval_status,created_at);
CREATE INDEX idx_certifications_product_status ON certifications(product_id,status);
CREATE UNIQUE INDEX uk_supplier_documents_object_key ON supplier_documents(object_key);
CREATE UNIQUE INDEX uk_product_images_object_key ON product_images(object_key);
CREATE UNIQUE INDEX uk_certifications_object_key ON certifications(object_key);
