import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, Alert } from 'react-bootstrap'
import PartnerSidebar from './PartnerSidebar'
import PartnerTopbar from './PartnerTopbar'
import PartnerDashboardView from './views/PartnerDashboardView'
import PartnerProductsView from './views/PartnerProductsView'
import PartnerBatchesView from './views/PartnerBatchesView'
import PartnerOrdersView from './views/PartnerOrdersView'
import PartnerVouchersView from './views/PartnerVouchersView'
import PartnerProfileView from './views/PartnerProfileView'
import { api } from '../../services/apiClient'
import '../admin/admin.css'

export default function PartnerPage({ onCatalogChanged }) {
  const { section = '' } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // Partner Core Data
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [orders, setOrders] = useState([])

  // Modal triggers from Topbar
  const [triggerCreateProduct, setTriggerCreateProduct] = useState(false)
  const [triggerCreateBatch, setTriggerCreateBatch] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const NO_PROFILE = Symbol('no-profile')
      const [profData, prodsData, ordersData] = await Promise.all([
        api.get('/api/suppliers/my').catch((e) => (e.status === 404 ? NO_PROFILE : null)),
        api.get('/api/partner/products').catch(() => []),
        api.get('/api/partner/orders').catch(() => []),
      ])

      // A partner account without a supplier profile cannot use the portal: send it to the application form.
      if (profData === NO_PROFILE) {
        navigate('/partner/register', { replace: true })
        return
      }
      setProfile(profData)
      setProducts(prodsData || [])
      setOrders(ordersData || [])

      // Load batches
      if (prodsData && prodsData.length > 0) {
        const batchLists = await Promise.all(
          prodsData.map((p) =>
            api.get(`/api/partner/products/${p.id}/batches`).catch(() => [])
          )
        )
        setBatches(batchLists.flat())
      } else {
        setBatches([])
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối cổng đối tác nhà vườn.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  // Stats for Sidebar
  const stats = {
    pendingProducts: products.filter((p) =>
      ['PENDING', 'PENDING_APPROVAL'].includes(p.approvalStatus)
    ).length,
    totalBatches: batches.length,
    pendingOrders: orders.filter((o) => ['CREATED', 'CONFIRMED'].includes(o.status)).length,
  }

  let mainView
  if (section === '' || section === 'dashboard') {
    mainView = (
      <PartnerDashboardView
        products={products}
        batches={batches}
        orders={orders}
        profile={profile}
        onNavigateSection={(sec) => navigate(`/partner/${sec}`)}
      />
    )
  } else if (section === 'products') {
    mainView = (
      <PartnerProductsView
        onCatalogChanged={onCatalogChanged}
        showCreateModalInit={triggerCreateProduct}
        onCloseCreateModalInit={() => setTriggerCreateProduct(false)}
      />
    )
  } else if (section === 'batches') {
    mainView = (
      <PartnerBatchesView
        showCreateModalInit={triggerCreateBatch}
        onCloseCreateModalInit={() => setTriggerCreateBatch(false)}
      />
    )
  } else if (section === 'orders') {
    mainView = <PartnerOrdersView />
  } else if (section === 'vouchers') {
    mainView = <PartnerVouchersView />
  } else if (section === 'profile') {
    mainView = <PartnerProfileView onCatalogChanged={onCatalogChanged} />
  } else {
    mainView = (
      <div className="admin-card text-center py-5">
        <h5 className="fw-bold text-dark">Mục không tồn tại</h5>
        <p className="text-secondary small">Vui lòng chọn mục từ thanh điều hướng bên trái.</p>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <PartnerSidebar
        activeSection={section}
        stats={stats}
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Wrap */}
      <div className="admin-main-wrap">
        <PartnerTopbar
          activeSection={section}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onOpenCreateProduct={() => {
            if (section === 'products') {
              setTriggerCreateProduct(true)
            } else {
              navigate('/partner/products')
            }
          }}
          onOpenCreateBatch={() => {
            if (section === 'batches') {
              setTriggerCreateBatch(true)
            } else {
              navigate('/partner/batches')
            }
          }}
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
              <div className="mt-2 text-secondary small">Đang kết nối cổng đối tác...</div>
            </div>
          ) : (
            mainView
          )}
        </main>
      </div>
    </div>
  )
}
