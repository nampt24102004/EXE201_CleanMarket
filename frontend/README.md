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
npm run build
```

Đăng nhập, session, CSRF, catalog, giỏ hàng, checkout, đơn hàng, hồ sơ, truy xuất và các portal Partner/Manager/Admin đều sử dụng API backend. VNPAY cần các biến Sandbox hợp lệ trong `backend/.env` để tạo URL thanh toán thật.

## Ngày mô phỏng trong danh sách đơn quản trị

Tài khoản ADMIN có công tắc **Ngày mô phỏng** ở màn hình Quản lý Đơn hàng. Khi bật, danh sách hiển thị mỗi đơn cách nhau một ngày theo thứ tự tạo, để trình bày giao diện; **ngày tạo thật luôn hiển thị kèm theo**. Công tắc mặc định tắt và chỉ thay đổi hiển thị trong phiên xem hiện tại. Bộ lọc ngày, báo cáo doanh thu, thanh toán, lịch sử đơn và dữ liệu database vẫn dùng ngày thật. Không dùng ngày mô phỏng làm số liệu kinh doanh thực.
