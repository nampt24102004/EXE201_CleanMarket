import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, Alert } from 'react-bootstrap'
import StaffSidebar from './StaffSidebar'
import StaffTopbar from './StaffTopbar'
import StaffDashboardView from './views/StaffDashboardView'
import StaffSuppliersView from './views/StaffSuppliersView'
import StaffVouchersView from './views/StaffVouchersView'
import StaffShippingView from './views/StaffShippingView'
import AdminOperationsView from '../admin/views/AdminOperationsView'
import { api } from '../../services/apiClient'
import '../admin/admin.css'

export default function StaffPage({ onCatalogChanged }) {
  const { section = '' } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [pendingCounts, setPendingCounts] = useState({
    suppliers: 0,
    products: 0,
    complaints: 0,
    refunds: 0,
  })
  const [totalOrders, setTotalOrders] = useState(0)
  const [vouchersCount, setVouchersCount] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [pendingSups, prods, cmps, refs, ordersPage, vchs] = await Promise.all([
        api.get('/api/manager/suppliers/pending').catch(() => []),
        api.get('/api/manager/products').catch(() => []),
        api.get('/api/manager/complaints').catch(() => []),
        api.get('/api/manager/refunds').catch(() => []),
        api.get('/api/manager/orders?size=1').catch(() => ({ totalElements: 0 })),
        api.get('/api/manager/vouchers').catch(() => []),
      ])

      setPendingCounts({
        suppliers: (pendingSups || []).length,
        products: (prods || []).length,
        complaints: (cmps || []).length,
        refunds: (refs || []).length,
      })
      setTotalOrders(ordersPage?.totalElements || 0)
      setVouchersCount((vchs || []).length)
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ vận hành.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const totalPending =
    pendingCounts.suppliers +
    pendingCounts.products +
    pendingCounts.complaints +
    pendingCounts.refunds

  let mainView
  if (section === '' || section === 'dashboard') {
    mainView = (
      <StaffDashboardView
        pendingCounts={pendingCounts}
        totalOrders={totalOrders}
        vouchersCount={vouchersCount}
        onNavigateSection={(targetSec) => navigate(`/manager/${targetSec}`)}
      />
    )
  } else if (section === 'suppliers') {
    mainView = <StaffSuppliersView onCatalogChanged={onCatalogChanged} />
  } else if (
    ['products', 'orders', 'complaints', 'refunds'].includes(section)
  ) {
    mainView = (
      <AdminOperationsView
        subSection={section}
        onCatalogChanged={onCatalogChanged}
      />
    )
  } else if (section === 'vouchers') {
    mainView = <StaffVouchersView />
  } else if (section === 'shipping-zones') {
    mainView = <StaffShippingView />
  } else {
    mainView = (
      <div className="admin-card text-center py-5">
        <h5 className="fw-bold text-dark">Mục vận hành không tồn tại</h5>
        <p className="text-secondary small">Vui lòng chọn mục từ thanh điều hướng bên trái.</p>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <StaffSidebar
        activeSection={section}
        pendingCounts={pendingCounts}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Wrap */}
      <div className="admin-main-wrap">
        <StaffTopbar
          activeSection={section}
          totalPending={totalPending}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <main className="admin-content-body">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <div className="mt-2 text-secondary small">Đang tải không gian vận hành...</div>
            </div>
          ) : (
            mainView
          )}
        </main>
      </div>
    </div>
  )
}
