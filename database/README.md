# Dữ liệu mẫu CleanMarket

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
