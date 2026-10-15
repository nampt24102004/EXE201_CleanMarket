import { useState, useEffect, useCallback } from 'react'
import { Table, Badge, Spinner, Alert } from 'react-bootstrap'
import { Truck, MapPin } from 'lucide-react'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

export default function StaffShippingView() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadZones = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/manager/shipping-zones')
      setZones(data || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải biểu phí giao hàng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadZones)
  }, [loadZones])

  return (
    <div className="staff-shipping-view">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="admin-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Biểu phí giao hàng theo khu vực (Shipping Zones)</h5>
            <p className="text-secondary small mb-0">
              Chính sách cước vận chuyển nông sản tươi CleanMarket áp dụng cho từng vùng
            </p>
          </div>
          <Badge bg="success" pill className="px-3 py-2">
            {zones.length} khu vực
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Truck size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Chưa có cấu hình khu vực giao hàng nào.</p>
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>Tên khu vực</th>
                <th>Phí giao hàng cơ bản</th>
                <th>Miễn phí cho đơn từ</th>
                <th>Thời gian dự kiến</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id || z.name}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={16} className="text-success" />
                      <strong className="text-dark fs-6">{z.name}</strong>
                    </div>
                  </td>
                  <td className="fw-bold text-dark">
                    {formatCurrency(Number(z.fee || z.baseFee || 0))}
                  </td>
                  <td className="text-success fw-bold">
                    {z.freeShippingThreshold
                      ? formatCurrency(Number(z.freeShippingThreshold))
                      : 'Không áp dụng'}
                  </td>
                  <td className="small text-secondary">{z.estimatedDays || '1 - 2 ngày'}</td>
                  <td>
                    <Badge bg={z.active !== false ? 'success' : 'secondary'} className="px-2 py-1">
                      {z.active !== false ? 'Đang phục vụ' : 'Tạm ngưng'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  )
}
