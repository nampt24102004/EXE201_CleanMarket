<div align="center">

# CleanMarket

**Nền tảng thương mại điện tử nông sản sạch, minh bạch nguồn gốc và kết nối trực tiếp người mua với nhà cung cấp.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

[Website](https://cleanmarket.io.vn) · [Website dự phòng](https://project-7180b607-0de7-493c-969.web.app) · [Báo lỗi](https://github.com/nampt24102004/EXE201_CleanMarket/issues)

</div>

## Giới thiệu

CleanMarket là hệ thống marketplace dành cho nông sản và thực phẩm sạch. Nền tảng hỗ trợ toàn bộ quy trình từ đăng ký nhà cung cấp, quản lý và kiểm duyệt sản phẩm, truy xuất lô hàng bằng QR, mua hàng, thanh toán, theo dõi đơn đến xử lý khiếu nại và hoàn tiền.

Dự án được xây dựng theo mô hình full-stack, gồm giao diện React, REST API Spring Boot và cơ sở dữ liệu MySQL. Bản production được triển khai trên Firebase Hosting và Google Cloud.

## Chức năng nổi bật

### Người mua

- Đăng ký, đăng nhập, xác minh email và khôi phục mật khẩu.
- Tìm kiếm, xem danh mục, sản phẩm và thông tin nhà cung cấp.
- Xem nguồn gốc sản phẩm theo mã truy xuất của từng lô hàng.
- Quản lý giỏ hàng, địa chỉ nhận hàng và lịch sử đơn hàng.
- Thanh toán COD, VNPAY hoặc payOS/VietQR.
- Đánh giá sản phẩm, gửi khiếu nại và theo dõi yêu cầu hoàn tiền.

### Nhà cung cấp

- Quản lý hồ sơ và giấy tờ nhà cung cấp.
- Đăng sản phẩm để gửi duyệt.
- Tạo lô hàng, chứng nhận và mã QR truy xuất nguồn gốc.
- Theo dõi các đơn thuộc nhà cung cấp và cập nhật tiến trình xử lý.

### Manager

- Duyệt hoặc từ chối hồ sơ nhà cung cấp và sản phẩm.
- Quản lý đơn hàng, khiếu nại và yêu cầu hoàn tiền.
- Kiểm tra chứng nhận và dữ liệu truy xuất.

### Administrator

- Quản lý tài khoản, vai trò và trạng thái người dùng.
- Quản lý danh mục sản phẩm.
- Theo dõi nhật ký hoạt động của hệ thống.

## Công nghệ sử dụng

- **Frontend:** React 19, Vite 8, React Router, React Bootstrap.
- **Backend:** Java 25, Spring Boot 3.5, Spring Security, Spring Data JPA, Bean Validation.
- **Database:** MySQL 8; H2 dùng trong kiểm thử.
- **Thanh toán:** payOS/VietQR và VNPAY.
- **Truy xuất:** ZXing tạo mã QR theo lô sản phẩm.
- **Tài liệu API:** OpenAPI và Swagger UI trong môi trường phát triển.
- **Production:** Firebase Hosting, Cloud Run, Cloud SQL và Secret Manager.

## Kiến trúc production

```mermaid
flowchart LR
    U[Người dùng] --> H[Firebase Hosting\nReact SPA]
    H -->|/api/**| R[Google Cloud Run\nSpring Boot API]
    R --> D[(Cloud SQL\nMySQL)]
    R --> S[Secret Manager]
    R --> P[payOS / VNPAY]
    R --> M[SMTP Email]
```

Firebase Hosting phục vụ ứng dụng React và chuyển tiếp mọi request `/api/**` tới Cloud Run. Backend kết nối Cloud SQL bằng Cloud SQL Connector; thông tin nhạy cảm được lưu trong Secret Manager thay vì mã nguồn.

## Cấu trúc thư mục

```text
EXE201_CleanMarket/
├── frontend/        # React SPA
├── backend/         # Spring Boot REST API
├── database/        # Dữ liệu mẫu và migration SQL
├── firebase.json    # Cấu hình Firebase Hosting và Cloud Run rewrite
├── start-dev.ps1    # Khởi động frontend và backend trên Windows
└── README.md
```

Backend được tổ chức theo từng nhóm nghiệp vụ trong `backend/src/main/java/com/app/features`, gồm `auth`, `user`, `suppliers`, `catalog`, `products`, `traceability`, `cart`, `orders`, `payments`, `feedback`, `audit` và `admin`.

## Chạy dự án trên máy cá nhân

### Yêu cầu

- JDK 25
- Node.js 22 trở lên và npm
- MySQL 8
- Git

### 1. Tải mã nguồn

```bash
git clone https://github.com/nampt24102004/EXE201_CleanMarket.git
cd EXE201_CleanMarket
```

### 2. Cấu hình backend

Tạo file môi trường từ mẫu có sẵn:

```powershell
Copy-Item backend/.env.example backend/.env
```

Trên macOS hoặc Linux:

```bash
cp backend/.env.example backend/.env
```

Mở `backend/.env` và cấu hình tối thiểu:

```properties
DB_URL=jdbc:mysql://localhost:3306/cleanmarket_db?createDatabaseIfNotExist=true
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
FRONTEND_BASE_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

Không commit file `.env` hoặc bất kỳ khóa thanh toán, mật khẩu SMTP và mật khẩu cơ sở dữ liệu nào lên GitHub.

### 3. Khởi động backend

Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
cd backend
./mvnw spring-boot:run
```

Backend chạy tại `http://localhost:8080`. Swagger UI có tại `http://localhost:8080/swagger-ui.html`.

### 4. Khởi động frontend

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

Truy cập `http://localhost:5173`. Vite sẽ chuyển tiếp `/api` tới backend ở cổng `8080`.

Trên Windows, sau khi đã tạo `backend/.env` và cài dependencies frontend, có thể khởi động cả hai ứng dụng bằng:

```powershell
.\start-dev.ps1
```

## Dữ liệu demo

Đặt các biến sau trong `backend/.env` nếu muốn backend tự tạo dữ liệu phục vụ phát triển:

```properties
DEMO_SEED=true
DEMO_PASSWORD=your_demo_password
```

Seeder tạo các tài khoản mẫu cho vai trò `USER`, `PARTNER`, `MANAGER`, `ADMIN` cùng nhà cung cấp, sản phẩm và lô truy xuất. Không bật `DEMO_SEED` trong production. Xem thêm hướng dẫn tại [`database/README.md`](database/README.md).

## Kiểm thử và build

Chạy kiểm thử backend:

```powershell
cd backend
.\mvnw.cmd test
```

Kiểm tra và build frontend:

```bash
cd frontend
npm run lint
npm run build
```

Các bài test backend sử dụng H2 nên không yêu cầu MySQL. Test hiện bao phủ xác thực, checkout nhiều nhà cung cấp, tồn kho, quyền sở hữu lô hàng và các luồng thanh toán payOS.

## Bảo mật

- Xác thực dựa trên session cookie với `HttpOnly`, `Secure` và `SameSite` trong production.
- CSRF token bắt buộc đối với các request làm thay đổi dữ liệu.
- Phân quyền theo vai trò `USER`, `PARTNER`, `MANAGER`, `ADMIN`.
- Mật khẩu được băm trước khi lưu trữ.
- Webhook thanh toán được kiểm tra chữ ký và xử lý idempotent.
- Secret production không được lưu trong repository.

Nếu phát hiện vấn đề bảo mật, không đăng thông tin nhạy cảm trong issue công khai. Hãy liên hệ trực tiếp với nhóm phát triển.

## Triển khai

- Frontend được build bằng Vite và phát hành qua Firebase Hosting.
- `/api/**` được Firebase Hosting rewrite tới service `cleanmarket-api` trên Cloud Run.
- Backend được đóng gói bằng Docker và chạy với profile `prod`.
- MySQL production chạy trên Cloud SQL.
- Mật khẩu và khóa dịch vụ được quản lý bằng Google Secret Manager.
- Mỗi lần code được push hoặc merge vào `main`, workflow `Deploy production` tự động chạy test, build container, áp dụng migration mới, deploy Cloud Run, deploy Firebase Hosting và smoke-test website.
- GitHub Actions xác thực với Google Cloud bằng OIDC/Workload Identity Federation; repository không lưu khóa service account dài hạn.

Chi tiết cấu hình backend và API được trình bày trong [`backend/README.md`](backend/README.md).

## Đóng góp

1. Fork repository và tạo branch từ nhánh chính.
2. Thực hiện thay đổi theo phạm vi rõ ràng.
3. Chạy test backend, lint và build frontend.
4. Tạo pull request kèm mô tả và cách kiểm thử.

---

<div align="center">
  CleanMarket — Nông sản sạch, nguồn gốc minh bạch.
</div>
