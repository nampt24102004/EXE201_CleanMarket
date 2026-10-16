import { useCallback, useEffect, useState } from 'react'
import { Button, Dropdown } from 'react-bootstrap'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/apiClient'
import { useAuth } from '../../context/useAuth'

const POLL_MS = 60000
const timeAgo = (value) => new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

// Review results (hồ sơ, giấy tờ, sản phẩm) and other in-app notices for the signed-in account.
export default function NotificationBell({ className = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inbox, setInbox] = useState({ unread: 0, items: [] })

  const load = useCallback(async () => {
    try { setInbox(await api.get('/api/notifications')) } catch { /* Signed out or offline: keep the last state. */ }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    void Promise.resolve().then(load)
    const timer = window.setInterval(load, POLL_MS)
    return () => window.clearInterval(timer)
  }, [user, load])

  if (!user) return null

  const open = async (item) => {
    if (!item.readAt) {
      try { await api.put(`/api/notifications/${item.id}/read`) } catch { /* Navigation matters more than the read flag. */ }
      setInbox((current) => ({ unread: Math.max(0, current.unread - 1), items: current.items.map((x) => (x.id === item.id ? { ...x, readAt: new Date().toISOString() } : x)) }))
    }
    if (item.link) navigate(item.link)
  }
  const readAll = async () => {
    try { await api.put('/api/notifications/read-all'); await load() } catch { /* ignore */ }
  }

  return (
    <Dropdown align="end" className={className} onToggle={(show) => { if (show) void load() }}>
      <Dropdown.Toggle
        as="button"
        className="header-icon-btn position-relative"
        aria-label="Thông báo hệ thống"
      >
        <Bell size={18} />
        {inbox.unread > 0 && (
          <span className="header-badge-dot">
            {inbox.unread > 99 ? '99+' : inbox.unread}
          </span>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu
        className="header-dropdown-menu p-0 shadow-lg"
        style={{ width: 340, maxHeight: 440, overflowY: 'auto' }}
      >
        <div
          className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light bg-opacity-50"
          style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-dark small">Thông báo</span>
            {inbox.unread > 0 && (
              <span className="badge rounded-pill bg-danger" style={{ fontSize: '0.68rem' }}>
                {inbox.unread} mới
              </span>
            )}
          </div>
          {inbox.unread > 0 && (
            <Button
              size="sm"
              variant="link"
              className="p-0 text-success text-decoration-none fw-semibold"
              style={{ fontSize: '0.78rem' }}
              onClick={readAll}
            >
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        {inbox.items.length === 0 && (
          <div className="text-center py-4 px-3 text-secondary">
            <Bell size={28} className="text-muted opacity-50 mb-2" />
            <div className="small fw-semibold">Không có thông báo mới</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Các cập nhật đơn hàng và phê duyệt sẽ hiển thị tại đây.
            </div>
          </div>
        )}
        {inbox.items.map((item) => (
          <Dropdown.Item
            key={item.id}
            onClick={() => open(item)}
            className={`px-3 py-2 border-bottom text-wrap ${
              item.readAt ? 'bg-white' : 'bg-success-subtle bg-opacity-25'
            }`}
            style={{ fontSize: '0.85rem' }}
          >
            <div className="d-flex align-items-start justify-content-between gap-1">
              <div className={`small ${item.readAt ? 'fw-semibold text-dark' : 'fw-bold text-success'}`}>
                {item.title}
              </div>
              {!item.readAt && (
                <span
                  className="bg-success rounded-circle mt-1 flex-shrink-0"
                  style={{ width: 6, height: 6 }}
                />
              )}
            </div>
            <div className="small text-secondary mt-1" style={{ whiteSpace: 'pre-line', lineHeight: 1.4 }}>
              {item.message}
            </div>
            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
              {timeAgo(item.createdAt)}
            </div>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
