import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Dropdown } from 'react-bootstrap'
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
      <Dropdown.Toggle as={Button} size="sm" variant="light" className="border position-relative d-flex align-items-center" aria-label="Thông báo">
        <Bell size={16} />
        {inbox.unread > 0 && <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">{inbox.unread > 99 ? '99+' : inbox.unread}</Badge>}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ width: 340, maxHeight: 420, overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2">
          <strong>Thông báo</strong>
          {inbox.unread > 0 && <Button size="sm" variant="link" className="p-0" onClick={readAll}>Đánh dấu đã đọc</Button>}
        </div>
        <Dropdown.Divider className="my-0" />
        {inbox.items.length === 0 && <div className="px-3 py-3 text-secondary small">Chưa có thông báo nào.</div>}
        {inbox.items.map((item) => (
          <Dropdown.Item key={item.id} onClick={() => open(item)} className={`py-2 text-wrap ${item.readAt ? '' : 'bg-success-subtle'}`}>
            <div className="fw-semibold small">{item.title}</div>
            <div className="small text-secondary" style={{ whiteSpace: 'pre-line' }}>{item.message}</div>
            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{timeAgo(item.createdAt)}</div>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
