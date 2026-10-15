import { useCallback, useEffect, useState } from 'react'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import HomePage from './pages/home/HomePage'
import ProductsPage from './pages/products/ProductsPage'
import ProductDetailPage from './pages/product-detail/ProductDetailPage'
import CartPage from './pages/cart/CartPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import OrderSuccessPage from './pages/order-success/OrderSuccessPage'
import NotFoundPage from './pages/shared/NotFoundPage'
import AuthPage from './pages/auth/AuthPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import TracePage from './pages/trace/TracePage'
import SupplierPage from './pages/suppliers/SupplierPage'
import AdminPage from './pages/admin/AdminPage'
import StaffPage from './pages/staff/StaffPage'
import PartnerPage from './pages/partner/PartnerPage'
import { MyOrdersPage, OrderDetailPage, PaymentResultPage, ProfilePage } from './pages/user/UserPages'
import ProtectedRoute from './routes/ProtectedRoute'
import PayOSPaymentPage from './pages/payment/PayOSPaymentPage'
import SupplierRegistrationPage from './pages/supplier-registration/SupplierRegistrationPage'
import { PartnerProductFormPage } from './pages/partner-products/PartnerProductPages'
import { ApprovalDetailPage } from './pages/approvals/ApprovalPages'
import { api } from './services/apiClient'

const blankCustomer = { fullName: '', phone: '', email: '', address: '', note: '' }
const stepFor = (product) => product.unit === 'kg' ? 0.5 : 1
const normalizeQuantity = (product, value) => Number(Math.max(stepFor(product), Math.round(Number(value) / stepFor(product)) * stepFor(product)).toFixed(1))

const normalizeProduct = (product) => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  shortDescription: product.description || '',
  price: Number(product.price),
  unit: product.unit,
  image: product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  stock: Number(product.stock),
  category: product.category?.name || '',
  categoryId: product.category?.id,
  supplierId: product.supplier?.id,
  supplierName: product.supplier?.name || '',
  origin: product.supplier?.location || '',
  supplier: product.supplier,
  vietgapCertificate: product.certificateNo,
  certificateNo: product.certificateNo,
  batch: product.batch || null,
  averageRating: product.averageRating ?? null,
  reviewCount: product.reviewCount || 0,
  approvalStatus: 'APPROVED',
  status: 'ACTIVE',
})

function normalizeOrder(order, products, email) {
  const items = (order.supplierOrders || []).flatMap((part) => (part.items || []).map((item) => {
    const catalogProduct = products.find((product) => product.id === item.productId)
    return {
      id: item.id,
      product: catalogProduct || {
        id: item.productId,
        name: item.productName,
        price: Number(item.unitPrice),
        unit: item.unit,
        supplierId: part.supplierId,
        supplierName: part.supplierName,
      },
      quantity: Number(item.quantity),
      totalAmount: Number(item.totalAmount),
    }
  }))
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    paymentMethod: order.paymentMethod?.toLowerCase(),
    createdAt: order.createdAt || new Date().toISOString(),
    customerEmail: email,
    customerInfo: { fullName: order.fullName, phone: order.phone, address: order.address, note: order.note, email },
    supplierOrders: (order.supplierOrders || []).map((part) => ({ ...part, totalAmount: Number(part.totalAmount) })),
    items,
  }
}

function ProductRoute({ products, quantity, setQuantity, onAddToCart, onBuyNow }) {
  const { id } = useParams()
  const product = products.find((item) => String(item.id) === id)
  if (!product) return <Container className="py-5"><Alert variant="danger">Không tìm thấy sản phẩm đang bán.</Alert></Container>
  return <ProductDetailPage product={product} batch={product.batch} quantity={quantity} onQuantityChange={setQuantity} onAddToCart={onAddToCart} onBuyNow={(value) => onBuyNow(product, value)} />
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, hasRole } = useAuth()
  const isPartner = hasRole('PARTNER')
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [orders, setOrders] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [customerInfo, setCustomerInfo] = useState(blankCustomer)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [validationErrors, setValidationErrors] = useState([])
  const [placedOrder, setPlacedOrder] = useState(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const showError = useCallback((caught) => {
    if (isPartner && caught?.status === 403) return
    setApiError([caught?.message || 'Không thể kết nối backend.', ...(caught?.errors || [])].join(' '))
  }, [isPartner])

  const loadCatalog = useCallback(async () => {
    try {
      const [productData, supplierData] = await Promise.all([api.get('/api/products'), api.get('/api/suppliers')])
      setProducts(productData.map(normalizeProduct))
      setSuppliers(supplierData)
      setApiError('')
    } catch (caught) {
      showError(caught)
    } finally {
      setCatalogLoading(false)
    }
  }, [showError])

  const loadCart = useCallback(async () => {
    if (!hasRole('USER')) return setCartItems([])
    try {
      const data = await api.get('/api/cart')
      setCartItems(data.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity),
        product: products.find((product) => product.id === item.productId) || {
          id: item.productId, name: item.productName, price: Number(item.price), unit: item.unit,
          supplierName: item.supplierName, image: '',
        },
      })))
    } catch (caught) { showError(caught) }
  }, [products, showError, hasRole])

  const loadOrders = useCallback(async () => {
    if (!hasRole('USER')) return setOrders([])
    try {
      const data = await api.get('/api/orders')
      const normalized = data.map((order) => normalizeOrder(order, products, user.email))
      const reconciled = await Promise.all(normalized.map(async (order) => {
        if (order.paymentMethod !== 'payos' || order.status !== 'PENDING_PAYMENT') return order
        try {
          const payment = await api.get(`/api/payments/order/${order.id}/status`)
          return { ...order, status: payment.orderStatus }
        } catch {
          return order
        }
      }))
      setOrders(reconciled)
    } catch (caught) { showError(caught) }
  }, [products, showError, user, hasRole])

  useEffect(() => { void Promise.resolve().then(loadCatalog) }, [loadCatalog])
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (hasRole('USER') && products.length) {
        loadCart()
        loadOrders()
        setCustomerInfo((current) => ({ ...current, fullName: current.fullName || user.name, email: user.email }))
      } else if (!user || !hasRole('USER')) {
        setCartItems([])
        setOrders([])
      }
    })
  }, [loadCart, loadOrders, products.length, user, hasRole])
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  const selectProduct = (product) => { setQuantity(stepFor(product)); navigate(`/products/${product.id}`) }

  const addToCart = async (product, value = stepFor(product)) => {
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    if (!hasRole('USER')) return setApiError('Chỉ tài khoản USER có thể mua hàng.')
    try {
      await api.post('/api/cart/items', { productId: product.id, quantity: normalizeQuantity(product, value) })
      await loadCart()
      setApiError('')
    } catch (caught) { showError(caught) }
  }

  const updateCart = async (productId, nextQuantity) => {
    const item = cartItems.find((entry) => entry.product.id === productId)
    if (!item) return
    try {
      await api.put(`/api/cart/items/${item.id}`, { quantity: normalizeQuantity(item.product, nextQuantity) })
      await loadCart()
    } catch (caught) { showError(caught) }
  }

  const removeCartItem = async (productId) => {
    const item = cartItems.find((entry) => entry.product.id === productId)
    if (!item) return
    try {
      await api.delete(`/api/cart/items/${item.id}`)
      await loadCart()
    } catch (caught) { showError(caught) }
  }

  const goCheckout = () => navigate(hasRole('USER') ? '/checkout' : '/login', { state: { from: '/checkout' } })
  const buyNow = async (product, value) => { await addToCart(product, value); if (hasRole('USER')) navigate('/checkout') }

  const confirmOrder = async () => {
    const errors = []
    if (!customerInfo.fullName.trim()) errors.push('Vui lòng nhập họ và tên.')
    if (!/^0\d{9}$/.test(customerInfo.phone.trim())) errors.push('Vui lòng nhập số điện thoại gồm 10 chữ số, bắt đầu bằng 0.')
    if (!customerInfo.address.trim()) errors.push('Vui lòng nhập địa chỉ giao hàng.')
    if (!paymentMethod) errors.push('Vui lòng chọn phương thức thanh toán.')
    if (!cartItems.length) errors.push('Giỏ hàng của bạn đang trống.')
    setValidationErrors(errors)
    if (errors.length) return
    try {
      const result = await api.post('/api/orders/checkout', {
        fullName: customerInfo.fullName,
        phone: customerInfo.phone,
        address: customerInfo.address,
        note: customerInfo.note,
        paymentMethod: paymentMethod.toUpperCase(),
      })
      const order = normalizeOrder(result, products, user.email)
      setPlacedOrder(order)
      setOrders((current) => [order, ...current])
      setCartItems([])
      setValidationErrors([])
      if (paymentMethod === 'payos') {
        try {
          const payment = await api.post('/api/payments/payos/create', { orderId: order.id })
          navigate(`/payment/payos?orderId=${order.id}`, { state: { payment } })
        } catch (caught) {
          showError(caught)
          navigate(`/payment/payos?orderId=${order.id}`)
        }
      } else navigate('/order-success')
    } catch (caught) { showError(caught) }
  }

  const protect = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>

  const isAdminRoute = location.pathname.startsWith('/admin')
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={protect(['ADMIN'], <AdminPage onCatalogChanged={loadCatalog} />)} />
        <Route path="/admin/suppliers/:id" element={protect(['ADMIN'], <ApprovalDetailPage kind="suppliers" base="/admin" />)} />
        <Route path="/admin/products/:id" element={protect(['ADMIN'], <ApprovalDetailPage kind="products" base="/admin" />)} />
        <Route path="/admin/:section" element={protect(['ADMIN'], <AdminPage onCatalogChanged={loadCatalog} />)} />
      </Routes>
    )
  }

  const isManagerRoute = location.pathname.startsWith('/manager')
  if (isManagerRoute) {
    return (
      <Routes>
        <Route path="/manager" element={protect(['MANAGER', 'ADMIN'], <StaffPage onCatalogChanged={loadCatalog} />)} />
        <Route path="/manager/suppliers/:id" element={protect(['MANAGER', 'ADMIN'], <ApprovalDetailPage kind="suppliers" base="/manager" />)} />
        <Route path="/manager/products/:id" element={protect(['MANAGER', 'ADMIN'], <ApprovalDetailPage kind="products" base="/manager" />)} />
        <Route path="/manager/:section" element={protect(['MANAGER', 'ADMIN'], <StaffPage onCatalogChanged={loadCatalog} />)} />
      </Routes>
    )
  }

  const isPartnerRoute = location.pathname.startsWith('/partner') && location.pathname !== '/partner/register'
  if (isPartnerRoute) {
    return (
      <Routes>
        <Route path="/partner" element={protect(['PARTNER'], <PartnerPage onCatalogChanged={loadCatalog} />)} />
        <Route path="/partner/products/create" element={protect(['PARTNER'], <PartnerProductFormPage />)} />
        <Route path="/partner/products/:id/edit" element={protect(['PARTNER'], <PartnerProductFormPage />)} />
        <Route path="/partner/:section" element={protect(['PARTNER'], <PartnerPage onCatalogChanged={loadCatalog} />)} />
      </Routes>
    )
  }

  return <div className="app-shell"><Header cartCount={cartItems.length} /><div className="page-spacer">
    {apiError && !(isPartner && apiError === 'Bạn không có quyền truy cập') && <Container className="pt-3"><Alert variant="danger" dismissible onClose={() => setApiError('')}><strong>Lỗi API:</strong> {apiError}</Alert></Container>}
    {catalogLoading ? <Container className="py-5 text-center"><Spinner animation="border" variant="success" /><div className="mt-2">Đang tải dữ liệu từ backend...</div></Container> : <Routes>
      <Route path="/" element={<HomePage products={products} suppliers={suppliers} onSelectProduct={selectProduct} onAddToCart={addToCart} onOpenProducts={() => navigate('/products')} />} />
      <Route path="/products" element={<ProductsPage products={products} onSelectProduct={selectProduct} onAddToCart={addToCart} />} />
      <Route path="/products/:id" element={<ProductRoute products={products} quantity={quantity} setQuantity={setQuantity} onAddToCart={addToCart} onBuyNow={buyNow} />} />
      <Route path="/product-detail" element={<Navigate to="/products" replace />} />
      <Route path="/suppliers/:id" element={<SupplierPage products={products} suppliers={suppliers} onSelectProduct={selectProduct} onAddToCart={addToCart} />} />
      <Route path="/trace/:traceCode" element={<TracePage />} />
      <Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage registerMode />} /><Route path="/verify-email" element={<VerifyEmailPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/cart" element={<CartPage cartItems={cartItems} onUpdateQuantity={updateCart} onRemoveItem={removeCartItem} onCheckout={goCheckout} onOpenProducts={() => navigate('/products')} />} />
      <Route path="/checkout" element={protect(['USER'], cartItems.length ? <CheckoutPage cartItems={cartItems} customerInfo={customerInfo} paymentMethod={paymentMethod} validationErrors={validationErrors} onCustomerInfoChange={setCustomerInfo} onPaymentMethodChange={setPaymentMethod} onConfirmOrder={confirmOrder} /> : <Navigate to="/cart" replace />)} />
      <Route path="/order-success" element={protect(['USER'], placedOrder ? <OrderSuccessPage order={placedOrder} onBackHome={() => navigate('/orders')} /> : <Navigate to="/orders" replace />)} />
      <Route path="/payment-result" element={protect(['USER'], <PaymentResultPage orders={orders} />)} />
      <Route path="/payment/payos" element={protect(['USER'], <PayOSPaymentPage />)} />
      <Route path="/payment/success" element={protect(['USER'], <PayOSPaymentPage returnMode />)} />
      <Route path="/payment/cancel" element={protect(['USER'], <PayOSPaymentPage returnMode />)} />
      <Route path="/orders" element={protect(['USER'], <MyOrdersPage orders={orders} />)} />
      <Route path="/orders/:orderCode" element={protect(['USER'], <OrderDetailPage orders={orders} onOrdersChanged={loadOrders} />)} />
      <Route path="/profile" element={protect(['USER', 'PARTNER', 'MANAGER', 'ADMIN'], <ProfilePage />)} />
      <Route path="/partner/register" element={protect(['USER'], <SupplierRegistrationPage />)} />
      <Route path="/403" element={<Container className="py-5"><Alert variant="danger">Bạn không có quyền truy cập khu vực này.</Alert></Container>} />
      <Route path="*" element={<NotFoundPage currentPath={location.pathname} onBackHome={() => navigate('/')} />} />
    </Routes>}
  </div><Footer /></div>
}

export default function App() { return <BrowserRouter><AuthProvider><AppContent /></AuthProvider></BrowserRouter> }
