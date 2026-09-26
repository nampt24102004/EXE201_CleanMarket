# Mô hình dữ liệu CleanMarket

Backend ánh xạ 31 bảng sang JPA entity. Entity và repository được đặt trong feature sở hữu dữ liệu. Các entity kế thừa BaseEntity có id, createdAt và updatedAt.

| Feature | Bảng | Entity | Trạng thái |
| --- | --- | --- | --- |
| auth | users | UserAccount | Đang dùng |
| auth | roles | Role | Có entity và repository |
| auth | permissions | Permission | Có entity và repository |
| auth | user_roles | UserRoleAssignment | Có entity và repository |
| auth | role_permissions | RolePermissionAssignment | Có entity và repository |
| user | addresses | Address | Có entity và repository |
| suppliers | suppliers | Supplier | Đang dùng |
| suppliers | supplier_documents | SupplierDocument | Có entity và repository |
| catalog | categories | Category | Đang dùng |
| products | products | Product | Đang dùng |
| products | product_images | ProductImage | Có entity và repository |
| traceability | product_batches | ProductBatch | Đang dùng |
| traceability | certifications | Certification | Có entity và repository |
| traceability | trace_events | TraceEvent | Có entity và repository |
| cart | carts | Cart | Đang dùng |
| cart | cart_items | CartItem | Đang dùng |
| orders | orders | MarketOrder | Đang dùng |
| orders | supplier_orders | SupplierOrder | Đang dùng |
| orders | order_items | OrderItem | Đang dùng |
| orders | order_status_history | OrderStatusHistory | Đang dùng |
| payments | payments | Payment | Đang dùng |
| payments | payment_transactions | PaymentTransaction | Đang dùng |
| feedback | reviews | Review | Đang dùng |
| feedback | complaints | Complaint | Đang dùng |
| feedback | complaint_evidence | ComplaintEvidence | Có entity và repository |
| feedback | refunds | Refund | Đang dùng |
| promotions | vouchers | Voucher | Có entity và repository |
| promotions | voucher_usages | VoucherUsage | Có entity và repository |
| notifications | notifications | Notification | Có entity và repository |
| audit | audit_logs | AuditLog | Đang dùng |
| admin | system_settings | SystemSetting | Có entity và repository |

## Quan hệ chính

- Một User có một Cart và có thể có nhiều Address, Order, Review, Notification.
- Một Supplier có nhiều Product và SupplierDocument. Product thuộc một Category, có thể có nhiều ProductImage và ProductBatch.
- Certification thuộc đúng một trong ba đối tượng: Supplier, Product hoặc ProductBatch. ProductBatch có nhiều TraceEvent.
- Order chứa nhiều SupplierOrder; mỗi SupplierOrder chứa nhiều OrderItem. Payment thuộc Order và có nhiều PaymentTransaction. OrderStatusHistory ghi sự kiện tạo, thanh toán, hủy và giao đơn.
- UserRoleAssignment và RolePermissionAssignment dùng khóa chính ghép, khớp các bảng liên kết trong SRS.

## Phạm vi dữ liệu hiện tại

Luồng đăng nhập và phân quyền vẫn đọc UserAccount.role. Các bảng roles, permissions và bảng liên kết đã có entity/repository, nhưng chưa thay đổi quyết định phân quyền của Spring Security. API sản phẩm vẫn dùng Product.imageUrl; bảng product_images chuẩn bị cho nhiều ảnh. Các bảng voucher, notification, document, certification, evidence và address chưa có API nghiệp vụ.

OrderItem.batch hiện cho phép null vì checkout đang kiểm tra tồn kho theo Product. CartItem giữ user_id để tương thích dữ liệu hiện có và đồng thời liên kết với carts. Khi checkout, subtotal được lấy từ giá trị sản phẩm, còn discount và shippingFee bắt đầu bằng 0.

Với MySQL đã có dữ liệu, cần chuẩn bị migration trước khi triển khai production. Bộ kiểm thử hiện tạo schema H2 mới, chưa kiểm chứng việc nâng cấp dữ liệu cũ.