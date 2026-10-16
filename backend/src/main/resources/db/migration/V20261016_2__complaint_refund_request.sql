-- Customers can say what they want from a complaint (exchange, refund, other) and how much money they ask back.
USE cleanmarket_db;

ALTER TABLE complaints
  ADD COLUMN request_type VARCHAR(20) NULL,
  ADD COLUMN requested_amount DECIMAL(15,2) NULL;
