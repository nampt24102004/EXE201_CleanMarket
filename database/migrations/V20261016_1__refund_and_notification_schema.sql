-- Schema required by the order complaint, refund-bank and notification flows.
-- This follows V20261016, which may already be recorded by Flyway even when a
-- later JPA validation step prevented the Cloud Run revision from starting.
USE cleanmarket_db;

ALTER TABLE complaints
  ADD COLUMN supplier_order_id BIGINT NULL,
  ADD CONSTRAINT fk_complaints_supplier_order
    FOREIGN KEY (supplier_order_id) REFERENCES supplier_orders(id);

ALTER TABLE refunds
  ADD COLUMN bank_name VARCHAR(120) NULL,
  ADD COLUMN bank_account_number VARCHAR(30) NULL,
  ADD COLUMN bank_account_holder VARCHAR(120) NULL,
  ADD COLUMN bank_submitted_at DATETIME(6) NULL,
  ADD COLUMN bank_review_note VARCHAR(500) NULL,
  ADD COLUMN reviewed_by BIGINT NULL,
  ADD COLUMN reviewed_at DATETIME(6) NULL,
  ADD COLUMN completed_at DATETIME(6) NULL,
  ADD CONSTRAINT fk_refunds_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id);

ALTER TABLE notifications
  ADD COLUMN link VARCHAR(300) NULL;
