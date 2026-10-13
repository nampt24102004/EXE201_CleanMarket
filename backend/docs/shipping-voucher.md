# Shipping fee và voucher

Chạy `database/migrations/V20261012__shipping_and_vouchers.sql` một lần trên `cleanmarket_db` trước khi kiểm thử dữ liệu cũ.

## API khách hàng

- `POST /api/checkout/shipping-quote`: tính phí giao hàng từ giỏ và địa chỉ.
- `POST /api/checkout/quote`: tính toàn bộ tạm tính, voucher theo nhà cung cấp, voucher sàn, phí giao hàng và tổng thanh toán.
- `POST /api/orders/checkout`: tạo đơn từ chính báo giá phía backend. Frontend không gửi số tiền.

## API quản trị

- Partner: `/api/partner/vouchers`
- Manager: `/api/manager/vouchers`
- Admin: `/api/admin/shipping-zones`
- Manager xem cấu hình phí: `GET /api/manager/shipping-zones`

Mỗi đơn dùng tối đa một voucher của từng nhà cung cấp và một voucher toàn sàn. Một phí giao hàng được tính cho toàn đơn. Lượt voucher được giữ khi tạo đơn, xác nhận khi COD được tạo hoặc thanh toán online thành công, và trả lại khi đơn chờ thanh toán bị hủy.
