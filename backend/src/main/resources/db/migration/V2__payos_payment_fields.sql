-- CleanMarket payOS integration. Apply once to an existing MySQL 8 database.
USE cleanmarket_db;

ALTER TABLE payments
    ADD COLUMN provider_order_code BIGINT NULL,
    ADD COLUMN provider_payment_link_id VARCHAR(100) NULL,
    ADD COLUMN checkout_url VARCHAR(1000) NULL,
    ADD COLUMN qr_code TEXT NULL,
    ADD COLUMN expires_at DATETIME(6) NULL,
    ADD CONSTRAINT uk_payments_provider_order_code UNIQUE (provider_order_code);

CREATE INDEX idx_payment_transactions_provider_txn
    ON payment_transactions (provider_transaction_no);