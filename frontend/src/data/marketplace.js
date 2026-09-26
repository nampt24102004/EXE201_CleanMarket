import products from './products'

export const suppliers = [
  { id: 'green-farm', name: 'Nông trại Mùa Xanh', location: 'Lâm Đồng', status: 'APPROVED', description: 'Rau củ canh tác theo quy trình kiểm soát từ hạt giống đến thu hoạch.' },
  { id: 'highland', name: 'Hợp tác xã Cao Nguyên', location: 'Sơn La', status: 'APPROVED', description: 'Nông sản vùng cao được chọn lọc và đóng gói tại nguồn.' },
  { id: 'sunny', name: 'Nông trại Nắng Mới', location: 'Gia Lai', status: 'APPROVED', description: 'Nông sản theo mùa từ các hộ trồng liên kết.' },
]

export const catalog = products.map((product, index) => ({
  ...product,
  supplierId: suppliers[index % suppliers.length].id,
  supplierName: suppliers[index % suppliers.length].name,
  category: index < 3 ? 'Rau lá' : index < 6 ? 'Củ quả' : 'Thực phẩm khác',
  stock: 25 + index * 8,
  status: 'ACTIVE',
  approvalStatus: 'APPROVED',
}))

export const initialBatches = catalog.map((product, index) => ({
  id: `batch-${product.id}`,
  productId: product.id,
  batchCode: `CM-2026-${String(index + 1).padStart(4, '0')}`,
  traceCode: `tr_${['a8f39c4d67b14e2aa19db3c4e6f278ab','c9d42aeb40af41ebac864519b9172d10','d1a876af6b384efbaa093b7f4d291f53','e7c85a9d442146d6ad487d815ec30f22','f9431b0a895c44fc9a817e2f5b25e71a','a18c47797b29426fb6a802fb494730ee','bb18e5077d0d47579443c848842ade22','c3d514aa2d77491c875c0c91e446550f','d772e9b3afc6482bbddca3f28e582d2e','e11155c4c35a45128e2250b3c52d761e','f912cc8144c64eb28c949c147db1952b'][index]}`,
  farmName: product.farmName,
  origin: product.farmLocation,
  harvestDate: '2026-09-18',
  packagingDate: '2026-09-19',
  expiryDate: '2026-10-10',
  certificateNo: product.vietgapCertificate,
  status: 'ACTIVE',
  quantity: product.stock,
}))

export const demoAccounts = [
  { email: 'user@cleanmarket.vn', password: 'demo123', name: 'Khách hàng Demo', role: 'USER' },
  { email: 'partner@cleanmarket.vn', password: 'demo123', name: 'Nông trại Mùa Xanh', role: 'PARTNER', supplierId: 'green-farm' },
  { email: 'manager@cleanmarket.vn', password: 'demo123', name: 'Quản lý Demo', role: 'MANAGER' },
  { email: 'admin@cleanmarket.vn', password: 'demo123', name: 'Quản trị Demo', role: 'ADMIN' },
]
