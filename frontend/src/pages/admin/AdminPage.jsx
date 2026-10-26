import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, Alert } from 'react-bootstrap'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import AdminDashboardView from './views/AdminDashboardView'
import AdminRevenueView from './views/AdminRevenueView'
import AdminPaymentsView from './views/AdminPaymentsView'
import AdminUsersView from './views/AdminUsersView'
import AdminCategoriesView from './views/AdminCategoriesView'
import AdminShippingView from './views/AdminShippingView'
import AdminSettingsView from './views/AdminSettingsView'
import AdminAuditView from './views/AdminAuditView'
import AdminOperationsView from './views/AdminOperationsView'
import AdminProductsView from './views/AdminProductsView'
import AdminOrdersView from './views/AdminOrdersView'
import AdminBannersView from './views/AdminBannersView'
import { api } from '../../services/apiClient'
import { buildDemoTimeline, loadAllAdminPages } from './demoTimeline'
import './admin.css'

export default function AdminPage({ onCatalogChanged }) {
  const { section = '' } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [showDemoDates, setShowDemoDates] = useState(false)
  const [demoTimeline, setDemoTimeline] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')

  const loadDemoTimeline = useCallback(async () => {
    setDemoLoading(true)
    setDemoError('')
    try {
      const orders = await loadAllAdminPages(api, '/api/manager/orders')
      setDemoTimeline(buildDemoTimeline(orders))
    } catch (err) {
      setDemoError(err.message || 'Không thể tạo mốc thời gian mô phỏng.')
      setShowDemoDates(false)
    } finally {
      setDemoLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showDemoDates) void Promise.resolve().then(loadDemoTimeline)
  }, [showDemoDates, loadDemoTimeline])

  const toggleDemoDates = (enabled) => {
    if (enabled) setDemoTimeline(null)
    setShowDemoDates(enabled)
  }

  const demoDateProps = {
    showDemoDates,
    onToggleDemoDates: toggleDemoDates,
    demoTimeline,
    demoLoading,
    refreshDemoTimeline: loadDemoTimeline,
  }

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.get('/api/admin/dashboard/summary')
      setSummary(data)
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ quản trị.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadSummary)
  }, [loadSummary])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSummary()
  }

  let mainView
  if (section === '' || section === 'dashboard') {
    mainView = (
      <AdminDashboardView
        summary={summary}
        onNavigateSection={(targetSec) => navigate(`/admin/${targetSec}`)}
      />
    )
  } else if (section === 'revenue-reports') {
    mainView = <AdminRevenueView {...demoDateProps} />
  } else if (section === 'payments') {
    mainView = <AdminPaymentsView {...demoDateProps} />
  } else if (section === 'users') {
    mainView = <AdminUsersView />
  } else if (section === 'categories') {
    mainView = <AdminCategoriesView onCatalogChanged={onCatalogChanged} />
  } else if (section === 'shipping') {
    mainView = <AdminShippingView />
  } else if (section === 'settings') {
    mainView = <AdminSettingsView />
  } else if (section === 'audit-logs') {
    mainView = <AdminAuditView />
  } else if (section === 'products') {
    mainView = (
      <AdminProductsView
        onCatalogChanged={onCatalogChanged}
        base="/admin"
      />
    )
  } else if (section === 'orders') {
    mainView = <AdminOrdersView {...demoDateProps} />
  } else if (section === 'banners') {
    mainView = <AdminBannersView base="/admin" />
  } else if (
    ['suppliers', 'complaints', 'refunds'].includes(section)
  ) {
    mainView = (
      <AdminOperationsView
        subSection={section}
        onCatalogChanged={onCatalogChanged}
      />
    )
  } else {
    mainView = (
      <div className="admin-card text-center py-5">
        <h5 className="fw-bold text-dark">Mục quản trị không tồn tại</h5>
        <p className="text-secondary small">Vui lòng chọn chức năng trên thanh điều hướng bên trái.</p>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={section}
        summary={summary}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="admin-main-wrap">
        <AdminTopbar
          activeSection={section}
          summary={summary}
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
          {demoError && <Alert variant="danger" onClose={() => setDemoError('')} dismissible>{demoError}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <div className="mt-2 text-secondary small">Đang khởi tạo không gian quản trị...</div>
            </div>
          ) : (
            mainView
          )}
        </main>
      </div>
    </div>
  )
}
