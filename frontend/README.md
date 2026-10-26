# CleanMarket Frontend

Frontend React + Vite đã kết nối với Spring Boot qua Vite proxy `/api`.

## Chạy riêng frontend

```powershell
npm install
npm run dev
```

Backend phải chạy tại `http://localhost:8080`. Mở giao diện tại `http://localhost:5173`.

Để chạy cả dự án, xem [RUN_FULL_PROJECT.md](../RUN_FULL_PROJECT.md).

## Kiểm tra mã nguồn

```powershell
npm run lint
npm test
npm run build
```

Đăng nhập, session, CSRF, catalog, giỏ hàng, checkout, đơn hàng, hồ sơ, truy xuất và các portal Partner/Manager/Admin đều sử dụng API backend. VNPAY cần các biến Sandbox hợp lệ trong `backend/.env` để tạo URL thanh toán thật.

## Ngày mô phỏng trong các trang quản trị

Trạng thái công tắc được lưu riêng cho từng tài khoản ADMIN trong trình duyệt và đồng bộ giữa các tab. Sau khi bật, chuyển giữa ba màn hình, mở tab khác hoặc tải lại trang vẫn giữ chế độ cho đến khi tắt công tắc. Nếu tải dữ liệu mô phỏng thất bại, màn hình hiển thị lỗi và nút thử lại, đồng thời giữ lựa chọn đã bật.

Tài khoản ADMIN có công tắc **Ngày mô phỏng** ở ba màn hình: Quản lý Đơn hàng, Báo cáo doanh thu và Giao dịch & Đối soát PayOS. Công tắc dùng chung khi chuyển trang và mặc định tắt trong lần xem đầu tiên. Khi bật, các đơn được phân bổ vào 31 ngày để trình bày; bảng thanh toán dùng cùng mốc mô phỏng theo mã đơn. Giao diện demo tạm ẩn các banner giải thích dài và ngày giờ thật trong bảng, chi tiết đơn và thanh toán; nhãn **Ngày mô phỏng** vẫn hiển thị. Biểu đồ doanh thu mô phỏng nhóm các thanh toán đã thu theo mốc đó; tổng tiền/số giao dịch giữ nguyên. Bộ lọc thời gian ở trang báo cáo tạm dừng trong chế độ này và Top sản phẩm/nhà cung cấp dùng dữ liệu toàn kỳ. Tắt công tắc để trở lại báo cáo theo ngày thật. Không có timestamp nào được ghi lại vào database, và không dùng ngày mô phỏng làm số liệu kinh doanh thực.
