-- Orders no longer use the PAID status (it came from the removed VNPAY flow); a paid order is CONFIRMED,
-- and SHIPPED now means at least one supplier has handed its part to delivery.
USE cleanmarket_db;

UPDATE orders SET status = 'CONFIRMED' WHERE status = 'PAID';
UPDATE order_status_history SET status = 'CONFIRMED' WHERE status = 'PAID';

-- Open orders where a supplier already shipped become SHIPPED.
UPDATE orders o SET o.status = 'SHIPPED'
WHERE o.status IN ('CREATED', 'CONFIRMED')
  AND EXISTS (SELECT 1 FROM supplier_orders so WHERE so.order_id = o.id AND so.status IN ('SHIPPED', 'DELIVERED'));
