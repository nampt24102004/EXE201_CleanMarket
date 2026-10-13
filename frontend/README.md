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

Đăng nhập, session, CSRF, catalog, giỏ hàng, checkout, đơn hàng, hồ sơ, truy xuất và các portal Partner/Manager/Admin đều sử dụng API backend. Thanh toán trực tuyến sử dụng payOS/VietQR.
