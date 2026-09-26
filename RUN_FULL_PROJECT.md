# Chạy toàn bộ CleanMarket

## Yêu cầu

- MySQL 8 đang chạy và đã có database `cleanmarket_db`.
- `backend/.env` đã cấu hình `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` và `JWT_SECRET`.
- Dữ liệu mẫu từ `database/demo_data.sql` đã được nạp.
- Java 21 và Node.js/npm đã được cài đặt.

## Khởi động bằng một lệnh

Tại thư mục gốc dự án:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Script mở hai cửa sổ PowerShell:

- Backend Spring Boot: `http://localhost:8080`
- Frontend React/Vite: `http://localhost:5173`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

Frontend gửi các request `/api` qua Vite proxy tới backend. Xác thực dùng session cookie và CSRF token do Spring Security cấp.

## Tài khoản demo

Mật khẩu chung: `Demo@123456`

| Vai trò | Email |
| --- | --- |
| User | `user@cleanmarket.vn` |
| Partner | `partner1@cleanmarket.vn` |
| Partner | `partner2@cleanmarket.vn` |
| Manager | `manager@cleanmarket.vn` |
| Admin | `admin@cleanmarket.vn` |

## Chạy thủ công

Terminal backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Terminal frontend:

```powershell
cd frontend
npm run dev
```

Luôn mở giao diện tại `http://localhost:5173`. Truy cập `http://localhost:8080` sẽ chuyển hướng sang frontend.