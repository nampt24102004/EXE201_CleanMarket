# Dữ liệu mẫu CleanMarket

## Chạy toàn bộ bằng một file

File [cleanmarket_full_data.sql](cleanmarket_full_data.sql) đã gộp phần nâng cấp payOS, Supplier/Partner, dữ liệu demo và đồng bộ ảnh. Đây là file nên dùng khi muốn thiết lập tổng thể mà không phải chạy từng script riêng.

1. Chạy backend một lần với `JPA_DDL_AUTO=update` để Hibernate tạo các bảng, sau đó dừng backend.
2. Mở MySQL Workbench, chọn **File > Open SQL Script** và mở `cleanmarket_full_data.sql`.
3. Chạy toàn bộ file bằng nút tia sét.
4. Khởi động lại backend và frontend.

Script tự chọn `cleanmarket_db`, kiểm tra cột/index trước khi thêm và dùng `INSERT IGNORE` cho dữ liệu demo. Các file trong `migrations` vẫn được giữ để theo dõi lịch sử thay đổi và không cần chạy riêng nếu đã chạy file tổng hợp.
File tổng hợp cũng tạm tắt `SQL_SAFE_UPDATES` trong phiên chạy để MySQL Workbench cho phép backfill dữ liệu, sau đó khôi phục đúng giá trị ban đầu.
Các bản ghi demo được chuẩn hóa trong phạm vi **Ba Vì - Hòa Lạc - Thạch Thất**. Khi database đã chứa dữ liệu địa danh cũ, chạy `migrations/V4__normalize_demo_regions.sql` một lần hoặc chạy lại file tổng hợp để cập nhật hồ sơ, sản phẩm và lô hàng demo mà không thay đổi ảnh sản phẩm.

[demo_data.sql](demo_data.sql) chứa dữ liệu mẫu cho 31 bảng trong mô hình hiện tại. Script dành cho MySQL 8 và chạy một lần trên database mới. Script không xóa dữ liệu; nếu chạy lại, các khóa chính/unique đã có sẽ báo lỗi.

## Cách nạp

1. Tạo database cleanmarket_db và chạy backend một lần với JPA_DDL_AUTO=update để Hibernate tạo bảng. Để DEMO_SEED=false và không dùng BOOTSTRAP_ADMIN_EMAIL trùng các tài khoản bên dưới.
2. Dừng backend, mở MySQL client tại thư mục gốc dự án:

~~~powershell
cd E:\Nam\Learn\SU_26\EXE101\CleanMarket
mysql --default-character-set=utf8mb4 -u root -p cleanmarket_db
~~~

3. Trong MySQL client, chạy:

~~~sql
SOURCE database/demo_data.sql;
~~~

Bạn cũng có thể mở demo_data.sql bằng MySQL Workbench hoặc DBeaver. Hãy chạy **toàn bộ file từ dòng đầu** để các lệnh `CREATE DATABASE` và `USE cleanmarket_db` được thực thi trước dữ liệu mẫu. Nếu chỉ chạy riêng một khối `INSERT`, hãy chạy `USE cleanmarket_db;` trước. Sau khi nạp xong, chạy lại backend.

## Tài khoản đăng nhập

Mật khẩu chung: **Demo@123456**. Chỉ dùng cho môi trường local/demo.

| Vai trò | Email |
| --- | --- |
| User | user@cleanmarket.vn |
| Partner 1 | partner1@cleanmarket.vn |
| Partner 2 | partner2@cleanmarket.vn |
| Manager | manager@cleanmarket.vn |
| Admin | admin@cleanmarket.vn |
| User có hồ sơ Partner chờ duyệt | applicant@cleanmarket.vn |

JWT_SECRET vẫn phải được cấu hình theo hướng dẫn của backend. Luồng phân quyền hiện đọc cột users.role; các bảng roles/permissions là dữ liệu chuẩn bị cho RBAC mở rộng.

## Kịch bản thử nhanh

- Danh mục và sản phẩm công khai: GET /api/categories và GET /api/products. Sản phẩm 705 đang chờ Manager duyệt nên chưa hiện công khai.
- QR truy xuất: GET /api/trace/CMDEMO-CARROT-001.
- Giỏ hàng User đã có Cà chua sạch; đăng nhập User để checkout.
- Đơn 1401 đã giao bằng COD. User có thể xem đơn, đánh giá mục đơn 1602; Manager có yêu cầu hoàn tiền thủ công 2301.
- Đơn 1402 là VNPAY/PENDING, có thể dùng endpoint tạo URL thanh toán khi cấu hình VNPAY Sandbox.
- Đơn 1403 là COD gồm hai Partner; Partner 1 và Partner 2 có thể xử lý phần đơn 1503 và 1504.
- Đơn 1404 là VNPAY/PAID **mô phỏng dữ liệu lịch sử**, không phải giao dịch thực do cổng VNPAY trả về.
- Supplier 503 và Product 705 đang chờ Manager duyệt.

Các ảnh và tài liệu dùng URL placeholder; chúng chỉ phục vụ trình bày. Voucher, notification, certification và một số bảng khác có dữ liệu mẫu để kiểm tra database, nhưng chưa có API nghiệp vụ tương ứng. Xem [mô hình dữ liệu](../backend/docs/data-model.md) để biết bảng nào đang được ứng dụng sử dụng.

## Migration payOS

Với database đã có dữ liệu, chạy một lần migrations/V2__payos_payment_fields.sql. Script chỉ thêm các cột mapping payOS và index tra cứu giao dịch, không xóa dữ liệu hiện có.

## Ảnh sản phẩm Bưởi

Ảnh minh họa Bưởi được lưu tại `frontend/public/images/products/buoi.webp` và phục vụ qua `/images/products/buoi.webp`. Các file seed đã sử dụng ảnh này. Migration `V20261026__pomelo_product_image.sql` thay URL placeholder `Buoi+Ba+Vi` trong sản phẩm và thư viện ảnh; Flyway tự chạy khi deploy production. Với database local đã có dữ liệu, chọn schema `cleanmarket_db` và chạy file cùng tên trong `database/migrations`.

Ảnh được tạo bằng imagegen. Prompt và thông tin nguồn được ghi tại [product-images.md](../frontend/docs/product-images.md).
