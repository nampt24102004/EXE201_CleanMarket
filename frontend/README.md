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

## Ngày mô phỏng trong các trang quản trị

Trạng thái công tắc được lưu riêng cho từng tài khoản ADMIN trong phiên tab trình duyệt. Sau khi bật, chuyển giữa ba màn hình hoặc tải lại trang vẫn giữ chế độ; đóng tab hoặc tắt công tắc sẽ đưa lần xem sau về ngày thật.

Tài khoản ADMIN có công tắc **Ngày mô phỏng** ở ba màn hình: Quản lý Đơn hàng, Báo cáo doanh thu và Giao dịch & Đối soát PayOS. Công tắc dùng chung khi chuyển trang trong cùng phiên xem và mặc định tắt. Khi bật, các đơn được phân bổ vào 31 ngày để trình bày; bảng thanh toán dùng cùng mốc mô phỏng theo mã đơn và vẫn hiển thị ngày giao dịch thật. Biểu đồ doanh thu mô phỏng nhóm các thanh toán đã thu theo mốc đó; tổng tiền/số giao dịch giữ nguyên. Bộ lọc thời gian ở trang báo cáo tạm dừng trong chế độ này và Top sản phẩm/nhà cung cấp dùng dữ liệu toàn kỳ. Tắt công tắc để trở lại báo cáo theo ngày thật. Không có timestamp nào được ghi lại vào database, và không dùng ngày mô phỏng làm số liệu kinh doanh thực.
