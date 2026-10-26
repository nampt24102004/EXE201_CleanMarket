USE cleanmarket_db;
SET NAMES utf8mb4;

-- Khôi phục URL ảnh từ frontend, chỉ thay ảnh rỗng hoặc ảnh placeholder.
UPDATE products
SET image_url = CASE id
  WHEN 701 THEN 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80'
  WHEN 702 THEN 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80'
  WHEN 703 THEN 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'
  WHEN 704 THEN '/images/products/buoi.webp'
  WHEN 705 THEN 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=900&q=80'
END
WHERE id IN (701, 702, 703, 704, 705)
  AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE 'https://placehold.co/%');

UPDATE product_images
SET image_url = CASE product_id
  WHEN 701 THEN 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80'
  WHEN 702 THEN 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80'
  WHEN 703 THEN 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'
  WHEN 704 THEN '/images/products/buoi.webp'
END
WHERE product_id IN (701, 702, 703, 704)
  AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE 'https://placehold.co/%');
