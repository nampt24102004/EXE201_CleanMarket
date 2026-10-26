import { useState, useEffect, useCallback, useRef } from 'react'
import { Row, Col, Form, Button, Table, Spinner, Badge } from 'react-bootstrap'
import {
  Calendar,
  TrendingUp,
  Package,
  Store,
  RefreshCw,
  Award,
} from 'lucide-react'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'
import { buildDemoRevenuePoints, loadAllAdminPages } from '../demoTimeline'

const getInitialDateRange = () => {
  const d = new Date()
  const to = d.toISOString().split('T')[0]
  d.setDate(d.getDate() - 30)
  const from = d.toISOString().split('T')[0]
  return { from, to }
}

export default function AdminRevenueView({ showDemoDates, onToggleDemoDates, demoTimeline, demoLoading }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groupBy, setGroupBy] = useState('day')
  const [dateRange, setDateRange] = useState(getInitialDateRange)

  const [revenuePoints, setRevenuePoints] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topSuppliers, setTopSuppliers] = useState([])
  const requestSeq = useRef(0)

  const loadReports = useCallback(async () => {
    const requestId = ++requestSeq.current
    setLoading(true)
    setError('')
    try {
      if (showDemoDates) {
        if (!demoTimeline) return
        const [payments, prods, sups] = await Promise.all([
          loadAllAdminPages(api, '/api/admin/payments'),
          api.get('/api/admin/reports/top-products?limit=6'),
          api.get('/api/admin/reports/top-suppliers?limit=6'),
        ])
        if (requestId === requestSeq.current) {
          setRevenuePoints(buildDemoRevenuePoints(payments, demoTimeline))
          setTopProducts(prods || [])
          setTopSuppliers(sups || [])
        }
      } else {
        const queryParams = `from=${dateRange.from}&to=${dateRange.to}`
        const [rev, prods, sups] = await Promise.all([
          api.get(`/api/admin/reports/revenue?${queryParams}&groupBy=${groupBy}`),
          api.get(`/api/admin/reports/top-products?${queryParams}&limit=6`),
          api.get(`/api/admin/reports/top-suppliers?${queryParams}&limit=6`),
        ])
        if (requestId === requestSeq.current) {
          setRevenuePoints(rev || [])
          setTopProducts(prods || [])
          setTopSuppliers(sups || [])
        }
      }
    } catch (err) {
      if (requestId === requestSeq.current) setError(err.message || 'Lỗi tải báo cáo doanh thu.')
    } finally {
      if (requestId === requestSeq.current) setLoading(false)
    }
  }, [dateRange, groupBy, showDemoDates, demoTimeline])

  useEffect(() => {
    if (!showDemoDates || demoTimeline) void Promise.resolve().then(loadReports)
  }, [loadReports, showDemoDates, demoTimeline])

  const displayLoading = loading || (showDemoDates && (demoLoading || !demoTimeline))
  const totalPeriodRevenue = revenuePoints.reduce((acc, cur) => acc + Number(cur.paidRevenue || 0), 0)
  const totalPeriodOrders = revenuePoints.reduce((acc, cur) => acc + Number(cur.paidOrders || 0), 0)
  const maxBarRevenue = Math.max(...revenuePoints.map((p) => Number(p.paidRevenue || 0)), 1)
  const visibleFrom = showDemoDates ? demoTimeline?.from : dateRange.from
  const visibleTo = showDemoDates ? demoTimeline?.to : dateRange.to

  return (
    <div className="admin-revenue-view">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Form.Check
          type="switch"
          id="admin-revenue-demo-dates"
          label={demoLoading ? 'Đang tải ngày mô phỏng...' : 'Ngày mô phỏng'}
          checked={showDemoDates}
          onChange={(event) => onToggleDemoDates(event.target.checked)}
          disabled={demoLoading}
        />
      </div>
      {showDemoDates && (
        <div className="alert alert-warning">
          <strong>Biểu đồ mô phỏng — không phải ngày thu tiền thật.</strong> Giao dịch đã thanh toán được
          phân bổ vào 31 ngày để trình bày; tổng số tiền và số giao dịch không đổi. Bộ lọc thời gian tạm
          dừng, Top sản phẩm/nhà cung cấp dùng dữ liệu toàn kỳ. Tắt công tắc để xem báo cáo theo ngày thật.
        </div>
      )}
      {/* Filter Toolbar */}
      <div className="admin-card mb-4">
        <Row className="align-items-center g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-secondary mb-1">
                <Calendar size={14} className="me-1 inline-block" /> Từ ngày
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={showDemoDates ? demoTimeline?.from || '' : dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                disabled={showDemoDates}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-secondary mb-1">
                <Calendar size={14} className="me-1 inline-block" /> Đến ngày
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={showDemoDates ? demoTimeline?.to || '' : dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                disabled={showDemoDates}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-secondary mb-1">
                Nhóm dữ liệu theo
              </Form.Label>
              <Form.Select
                size="sm"
                value={showDemoDates ? 'day' : groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                disabled={showDemoDates}
              >
                <option value="day">Theo ngày (Day)</option>
                <option value="month">Theo tháng (Month)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3} className="d-flex align-items-end">
            <Button
              variant="success"
              size="sm"
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={loadReports}
              disabled={displayLoading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Cập nhật báo cáo</span>
            </Button>
          </Col>
        </Row>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Summary Highlights */}
      <Row className="g-3 mb-4">
        <Col sm={6} md={4}>
          <div className="admin-kpi-card kpi-success">
            <span className="admin-kpi-label">{showDemoDates ? 'Tiền đã thu toàn kỳ (mốc mô phỏng)' : 'Doanh thu trong kỳ'}</span>
            <div className="admin-kpi-value text-success">
              {displayLoading ? '...' : formatCurrency(totalPeriodRevenue)}
            </div>
            <div className="small text-secondary mt-1">Đã thanh toán thực tế</div>
          </div>
        </Col>
        <Col sm={6} md={4}>
          <div className="admin-kpi-card kpi-primary">
            <span className="admin-kpi-label">{showDemoDates ? 'Giao dịch đã thu toàn kỳ' : 'Đơn hàng hoàn tất'}</span>
            <div className="admin-kpi-value text-primary">
              {displayLoading ? '...' : `${totalPeriodOrders} ${showDemoDates ? 'giao dịch' : 'đơn'}`}
            </div>
            <div className="small text-secondary mt-1">Giao dịch đã xác nhận thu tiền</div>
          </div>
        </Col>
        <Col sm={6} md={4}>
          <div className="admin-kpi-card kpi-purple">
            <span className="admin-kpi-label">Giá trị trung bình / đơn</span>
            <div className="admin-kpi-value text-dark">
              {displayLoading ? '...' : totalPeriodOrders > 0
                ? formatCurrency(Math.round(totalPeriodRevenue / totalPeriodOrders))
                : '0₫'}
            </div>
            <div className="small text-secondary mt-1">AOV (Average Order Value)</div>
          </div>
        </Col>
      </Row>

      {/* Interactive Visual Revenue Trend Chart */}
      <div className="admin-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              {showDemoDates ? 'Biểu đồ doanh thu — ngày mô phỏng' : 'Biểu đồ doanh thu theo thời gian'}
            </h5>
            <p className="text-secondary small mb-0">
              {showDemoDates ? 'Phân bổ ngày mô phỏng từ giao dịch thật' :
                `Xu hướng biến động doanh thu (${groupBy === 'day' ? 'từng ngày' : 'từng tháng'})`}
            </p>
          </div>
          <Badge bg="success" className="px-3 py-2">
            <TrendingUp size={14} className="me-1 inline-block" /> {revenuePoints.length} mốc dữ liệu
          </Badge>
        </div>

        {displayLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : revenuePoints.length === 0 ? (
          <div className="text-center py-4 text-secondary">
            Không có dữ liệu doanh thu trong khoảng thời gian này.
          </div>
        ) : (
          <div>
            {/* Chart Container */}
            <div
              className="d-flex align-items-end gap-1 gap-md-2 pt-3 pb-2 px-2 overflow-x-auto"
              style={{ minHeight: '220px', borderBottom: '2px solid #e2e8f0' }}
            >
              {revenuePoints.map((point) => {
                const heightPercent = Math.max(
                  Math.round((Number(point.paidRevenue || 0) / maxBarRevenue) * 100),
                  4
                )
                const pointDate = new Date(point.periodStart)
                const label =
                  !showDemoDates && groupBy === 'month'
                    ? `Tháng ${pointDate.getMonth() + 1}`
                    : `${pointDate.getDate()}/${pointDate.getMonth() + 1}`

                return (
                  <div key={point.periodStart} className="admin-bar-item" title={`${showDemoDates ? 'Ngày mô phỏng ' : ''}${point.periodStart}: ${formatCurrency(Number(point.paidRevenue))} (${point.paidOrders} giao dịch)`}>
                    <div
                      className="admin-bar-fill"
                      style={{ height: `${heightPercent * 1.6}px` }}
                    />
                    <span
                      className="text-secondary mt-2 fw-semibold"
                      style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="d-flex justify-content-between text-secondary small mt-2">
              <span>{visibleFrom}</span>
              <span>{visibleTo}</span>
            </div>
          </div>
        )}
      </div>

      {/* Top Products & Top Suppliers Row */}
      <Row className="g-4">
        {/* Top Products */}
        <Col lg={6}>
          <div className="admin-card h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Top sản phẩm bán chạy</h5>
                <p className="text-secondary small mb-0">Xếp hạng theo tổng doanh thu mang lại</p>
              </div>
              <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                <Package size={20} />
              </div>
            </div>

            {displayLoading ? (
              <div className="text-center py-4"><Spinner animation="border" size="sm" variant="success" /></div>
            ) : topProducts.length === 0 ? (
              <p className="text-secondary small">Chưa có dữ liệu sản phẩm trong kỳ.</p>
            ) : (
              <Table responsive className="admin-table">
                <thead>
                  <tr>
                    <th>Top</th>
                    <th>Sản phẩm</th>
                    <th>Nhà vườn</th>
                    <th>SL bán</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, index) => (
                    <tr key={p.productId}>
                      <td>
                        {index === 0 ? (
                          <Award size={18} className="text-warning" />
                        ) : (
                          <Badge bg="light" text="dark" className="border">
                            #{index + 1}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <strong className="text-dark">{p.productName}</strong>
                      </td>
                      <td className="small text-secondary">{p.supplierName}</td>
                      <td>{p.quantity}</td>
                      <td className="fw-bold text-success">
                        {formatCurrency(Number(p.revenue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Col>

        {/* Top Suppliers */}
        <Col lg={6}>
          <div className="admin-card h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Top nhà cung cấp hàng đầu</h5>
                <p className="text-secondary small mb-0">Đối tác có doanh số giao dịch cao nhất</p>
              </div>
              <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                <Store size={20} />
              </div>
            </div>

            {displayLoading ? (
              <div className="text-center py-4"><Spinner animation="border" size="sm" variant="primary" /></div>
            ) : topSuppliers.length === 0 ? (
              <p className="text-secondary small">Chưa có dữ liệu đối tác trong kỳ.</p>
            ) : (
              <Table responsive className="admin-table">
                <thead>
                  <tr>
                    <th>Top</th>
                    <th>Nhà cung cấp</th>
                    <th>Đơn hàng</th>
                    <th>Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topSuppliers.map((s, index) => (
                    <tr key={s.supplierId}>
                      <td>
                        {index === 0 ? (
                          <Award size={18} className="text-warning" />
                        ) : (
                          <Badge bg="light" text="dark" className="border">
                            #{index + 1}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <strong className="text-dark">{s.supplierName}</strong>
                      </td>
                      <td>{s.orderCount} đơn</td>
                      <td className="fw-bold text-primary">
                        {formatCurrency(Number(s.revenue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}
