-- Replace only the Ba Vi pomelo placeholder; preserve existing uploaded photos.
UPDATE products
SET image_url = '/images/products/buoi.webp'
WHERE image_url = 'https://placehold.co/900x700?text=Buoi+Ba+Vi';

UPDATE product_images
SET image_url = '/images/products/buoi.webp'
WHERE image_url = 'https://placehold.co/900x700?text=Buoi+Ba+Vi'
  AND object_key IS NULL;
