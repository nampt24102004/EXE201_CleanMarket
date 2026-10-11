# CleanMarket Backend

Spring Boot 3.5 / Java 25 / MySQL API dựa trên hai tài liệu CleanMarket System Design và SRS. Backend dùng session cookie, role USER/PARTNER/MANAGER/ADMIN, JPA, QR theo ProductBatch, checkout nhiều nhà cung cấp, COD, VNPAY Sandbox và payOS/VietQR.

## Chạy local

1. Cài Java 25+ và MySQL; tạo database `cleanmarket_db` hoặc để JDBC URL tạo database nếu tài khoản có quyền.
2. Sao chép [`.env.example`](.env.example) thành `.env`, rồi điền `DB_PASSWORD` và `JWT_SECRET`. Backend tự đọc `.env` từ thư mục làm việc; file này đã được Git bỏ qua.
3. Chạy trong thư mục `backend`:

```powershell
Copy-Item .env.example .env
# Chỉnh các giá trị local trong .env trước lần chạy đầu tiên.
.\mvnw.cmd spring-boot:run
```

Khi chạy bằng IntelliJ, đặt Working directory là thư mục `backend`. Có thể dùng biến môi trường của Run Configuration để ghi đè các giá trị trong `.env`.
API ở `http://localhost:8080/api`; Swagger UI ở `http://localhost:8080/swagger-ui.html`. Khi truy cập `http://localhost:8080/`, backend chuyển hướng sang frontend tại `http://localhost:5173`. `JPA_DDL_AUTO=update` chỉ thuận tiện cho môi trường phát triển. Trước khi triển khai production, dùng migration SQL/Flyway và đặt `JPA_DDL_AUTO=validate`.

Để có dữ liệu demo, đặt `DEMO_SEED=true` và `DEMO_PASSWORD` (ít nhất 8 ký tự). Seeder tạo tài khoản `user@cleanmarket.vn`, `partner@cleanmarket.vn`, `manager@cleanmarket.vn`, `admin@cleanmarket.vn`, cùng một nhà cung cấp, sản phẩm và lô truy xuất. Không bật seed demo trong production.

## Cấu trúc mã nguồn

Mỗi chức năng nằm trong src/main/java/com/app/features/<feature>/. Các feature hiện có: auth, user, suppliers, catalog, products, traceability, cart, orders, payments, feedback, audit, admin.

| Package | Vai trò |
| --- | --- |
| controller | Endpoint HTTP, validation đầu vào và gọi service |
| dto | Request và response |
| entity | Mô hình JPA |
| enums | Vai trò, phương thức thanh toán và trạng thái |
| repository | Truy cập dữ liệu |
| service | Interface nghiệp vụ |
| serviceimpl | Triển khai nghiệp vụ và transaction |

Một số feature có thêm security, config hoặc util. Feature chỉ chứa các package cần dùng; ví dụ user không có entity riêng. Mã dùng chung (response, xử lý lỗi và BaseEntity) nằm ở com/app/common. BackendApplication ở com/app để Spring quét toàn bộ feature.
Danh sách 31 bảng, quan hệ và trạng thái sử dụng nằm trong [data-model.md](docs/data-model.md).

## API chính

| Khu vực | Endpoint |
| --- | --- |
| Public | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/products`, `GET /api/products/{id}`, `GET /api/categories`, `GET /api/suppliers`, `GET /api/trace/{traceCode}` |
| User | `GET/POST/PUT/DELETE /api/cart...`, `POST /api/orders/checkout`, `GET /api/orders/my`, `POST /api/orders/{id}/cancel`, `POST /api/reviews`, `POST /api/complaints`, `GET/PUT /api/users/me` |
| Partner | `/api/partner/products`, `/api/partner/products/{id}/batches`, `/api/partner/batches/{id}/qr`, `/api/partner/orders`, `PUT /api/partner/supplier-profile` |
| Manager | `/api/manager/suppliers/pending`, `/api/manager/products`, `/api/manager/orders`, `/api/manager/complaints`, `/api/manager/refunds` |
| Admin | `/api/admin/users`, `/api/admin/roles`, `/api/admin/categories`, `/api/admin/audit-logs` |
| Payment | `POST /api/payments/vnpay/create`, `POST /api/payments/payos/create`, `POST /api/payments/payos/webhook`, `GET /api/payments/order/{orderId}/status` |

Response thành công dùng `{ "success": true, "data": ..., "message": "Success" }`; lỗi dùng `{ "success": false, "code": "...", "message": "...", "errors": [] }`. Đăng ký/đăng nhập trả về `user`, `roles` và thiết lập cookie `JSESSIONID`; không trả `accessToken`. Frontend dùng `fetch(..., { credentials: 'include' })` hoặc Axios `withCredentials: true` cho mọi request.

Trước khi gửi POST/PUT/PATCH/DELETE (kể cả đăng nhập/đăng ký), gọi `GET /api/auth/csrf` với cookie, lấy `data.token` và gửi qua header `X-CSRF-TOKEN`. Lấy lại token sau đăng nhập/đăng ký vì token được đổi. Đăng xuất bằng `POST /api/auth/logout` cùng cookie và CSRF token; thành công trả HTTP 204.

Ví dụ checkout từ giỏ của USER:

```json
{ "fullName": "Nguyễn Văn A", "phone": "0912345678", "address": "Hà Nội", "note": "", "paymentMethod": "COD" }
```

Backend đọc giá và tồn kho từ DB, khóa từng Product khi checkout, lưu tên/giá chụp trên OrderItem và tách SupplierOrder. Người mua có thể hủy đơn còn ở trạng thái CREATED nếu Partner chưa xử lý và không có yêu cầu VNPAY đang chờ; thao tác này hoàn tồn kho.

## VNPAY

Đặt `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL` theo merchant Sandbox. React chỉ gọi create với `orderId` và chuyển sang `paymentUrl`; backend tính số tiền từ Order, tạo HMAC-SHA512, kiểm tra chữ ký + mã merchant + số tiền tại IPN và chống callback lặp. Return URL chỉ chuyển người dùng về frontend; frontend phải hỏi API trạng thái thanh toán. IPN cần backend có HTTPS public; localhost chỉ đủ để thử các endpoint khác.

Refund hiện là **yêu cầu xử lý thủ công** gắn với complaint và payment, chưa gọi API hoàn tiền của VNPAY. Manager có thể ghi mã tham chiếu khi thao tác hoàn tiền bên ngoài đã hoàn tất qua endpoint `PUT /api/manager/refunds/{id}/manual-complete`; trạng thái này không tự xác nhận từ VNPAY.

## Kiểm thử

```powershell
.\mvnw.cmd test
```

Test dùng H2 tạm, không cần MySQL. Các ca hiện có xác minh checkout hai Partner, snapshot giá, trừ và hoàn tồn kho, IPN sai chữ ký/sai tiền/lặp, quyền sở hữu ProductBatch và truy xuất public.

## Kết nối frontend

Thư mục `../frontend` hiện vẫn dùng dữ liệu demo trong localStorage. Để chạy end-to-end, thay các thao tác demo bằng API ở trên và map response `data` sang component. Frontend đã gọi REST API backend cho cart/checkout/order/payment. Các giá trị `paymentMethod` là `COD`, `VNPAY`, `PAYOS`; trang payOS hiển thị VietQR và polling `/api/payments/order/{orderId}/status` mỗi 2,5 giây.

## Dữ liệu mẫu SQL

Xem [database/README.md](../database/README.md) để nạp dữ liệu mẫu MySQL và dùng tài khoản demo.

## payOS / VietQR

Project dùng SDK chính thức `vn.payos:payos-java:2.0.1`. Điền các biến sau trong `backend/.env`, biến môi trường của hệ điều hành hoặc Run Configuration của IDE. Không commit giá trị thật:

```properties
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
PAYOS_RETURN_URL=http://localhost:5173/payment/success
PAYOS_CANCEL_URL=http://localhost:5173/payment/cancel
```

`PAYOS_RETURN_URL` và `PAYOS_CANCEL_URL` là route React. Các URL này chỉ đưa khách về giao diện và không xác nhận thanh toán. Trạng thái `PAID` chỉ được ghi sau khi backend xác minh checksum webhook bằng SDK payOS, đối chiếu `orderCode`, `amount`, `paymentLinkId` và chống xử lý lặp.

Webhook cấu hình trong Dashboard payOS:

```text
https://TEN-MIEN-PUBLIC-CUA-BAN/api/payments/payos/webhook
```

payOS không gọi được `localhost`. Khi test local, dùng một HTTPS tunnel trỏ về `http://localhost:8080`, rồi nhập URL tunnel kèm `/api/payments/payos/webhook`. Endpoint webhook public khỏi session/CSRF nhưng mọi payload vẫn bắt buộc qua xác minh checksum payOS.

Nếu database đã tồn tại và không dùng `JPA_DDL_AUTO=update`, chạy một lần [`database/migrations/V2__payos_payment_fields.sql`](../database/migrations/V2__payos_payment_fields.sql). Migration chỉ thêm cột/index, không xóa dữ liệu. Kiểm tra sau thanh toán:

```sql
SELECT id, order_id, provider, provider_order_code, provider_payment_link_id,
       status, amount, provider_transaction_no, paid_at
FROM payments ORDER BY id DESC;

SELECT id, order_code, payment_method, status, total_amount
FROM orders ORDER BY id DESC;

SELECT payment_id, event_type, signature_valid, response_code,
       provider_transaction_no, created_at
FROM payment_transactions ORDER BY id DESC;
```

### Chạy full stack

Terminal 1:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Terminal 2:

```powershell
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173`, đăng nhập USER, thêm sản phẩm, checkout và chọn **payOS / VietQR**. Backend phải ở cổng 8080 để Vite proxy `/api` hoạt động.

### Checklist test payOS thật

1. Tạo đơn PAYOS và kiểm tra `orders.status=PENDING_PAYMENT`, `payments.status=PENDING`.
2. Trang thanh toán hiển thị đúng mã đơn, số tiền, QR và link payOS.
3. Quét QR bằng ứng dụng ngân hàng và thanh toán đúng số tiền/nội dung.
4. Xác nhận log backend nhận webhook; `payments.status=PAID`, `orders.status=CONFIRMED`.
5. Giao diện tự đổi sang “Thanh toán thành công” mà không cần refresh.
6. Kiểm tra email có sản phẩm, số lượng, tổng tiền và địa chỉ giao hàng.
7. Refresh `/payment/success?orderId=...`; trạng thái vẫn là `PAID`.
8. Gửi lại cùng webhook; không có email, notification hoặc transaction nghiệp vụ thứ hai.
9. Checkout COD để xác nhận luồng COD vẫn hoạt động.

Các secret không được commit: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `SMTP_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `VNPAY_HASH_SECRET`.
## Supplier registration, product approval và Cloudflare R2

Áp dụng một lần migration database/migrations/V3__supplier_partner_product_approval.sql trên cleanmarket_db trước khi chạy phiên bản này.

Các biến môi trường:

    R2_ACCOUNT_ID=your_cloudflare_account_id
    R2_ACCESS_KEY_ID=your_r2_access_key_id
    R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
    R2_BUCKET=cleanmarket
    R2_PUBLIC_BASE_URL=
    R2_PRESIGNED_GET_TTL_SECONDS=900
    UPLOAD_MAX_FILE_SIZE_MB=10
    UPLOAD_MAX_FILES=8

Tạo bucket và S3 API token trong Cloudflare R2. Access key/secret chỉ đặt ở backend/.env hoặc environment của máy chủ. Không đưa các giá trị này vào React hoặc Git. R2_PUBLIC_BASE_URL là tùy chọn; khi bỏ trống backend cấp URL đọc có thời hạn. Giấy tờ supplier và file chứng nhận được mở bằng URL ký có thời hạn cho Manager/Admin.

Luồng supplier:

1. USER mở /partner/register, gửi hồ sơ và giấy tờ.
2. Hồ sơ ở PENDING; các API /api/partner/** vẫn trả 403.
3. MANAGER hoặc ADMIN duyệt tại /manager/suppliers hoặc /admin/suppliers.
4. Transaction cập nhật supplier thành APPROVED, giữ role USER và thêm role PARTNER.
5. Người dùng đăng xuất/đăng nhập lại để phiên Spring Security nhận quyền mới.

Luồng product:

1. PARTNER đã được duyệt tạo sản phẩm ở DRAFT.
2. Upload ảnh/chứng nhận và gọi submit để chuyển sang PENDING.
3. MANAGER/ADMIN duyệt sản phẩm; sản phẩm chuyển APPROVED + ACTIVE.
4. Chứng nhận được duyệt riêng. Catalog chỉ trả chứng nhận APPROVED và chưa hết hạn.
