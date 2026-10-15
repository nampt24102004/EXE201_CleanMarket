import { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Table,
  Button,
  Badge,
  Form,
  Spinner,
  Alert,
  Modal,
} from 'react-bootstrap'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'
import { api } from '../../../services/apiClient'

export default function AdminCategoriesView({ onCatalogChanged }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Create Form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit Modal
  const [editCategory, setEditCategory] = useState(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/admin/categories')
      setCategories(data || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải danh mục.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadCategories)
  }, [loadCategories])

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    setAdding(true)
    setError('')
    setNotice('')
    try {
      await api.post('/api/admin/categories', { name: newCategoryName.trim() })
      setNotice(`Đã thêm danh mục "${newCategoryName}" thành công!`)
      setNewCategoryName('')
      await loadCategories()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi thêm danh mục: ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  const handleToggleStatus = async (item) => {
    setError('')
    setNotice('')
    try {
      const newActive = !item.active
      await api.put(`/api/admin/categories/${item.id}/status`, { enabled: newActive })
      setNotice(
        `Đã ${newActive ? 'kích hoạt' : 'ẩn'} danh mục "${item.name}".`
      )
      await loadCategories()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi cập nhật: ${err.message}`)
    }
  }

  const handleSaveRename = async (e) => {
    e.preventDefault()
    if (!editCategory || !editName.trim()) return
    setSavingEdit(true)
    setError('')
    setNotice('')
    try {
      await api.put(`/api/admin/categories/${editCategory.id}`, { name: editName.trim() })
      setNotice(`Đã đổi tên danh mục thành "${editName}" thành công!`)
      setEditCategory(null)
      await loadCategories()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi sửa danh mục: ${err.message}`)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="admin-categories-view">
      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Add Category Form Card */}
      <div className="admin-card mb-4">
        <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
          <Plus size={18} className="text-success" />
          <span>Thêm danh mục nông sản mới</span>
        </h6>
        <Form onSubmit={handleCreateCategory}>
          <Row className="g-2">
            <Col md={8}>
              <Form.Control
                placeholder="Ví dụ: Nấm & Đậu Hũ Hữu Cơ, Rau Củ Đặc Sản Đà Lạt..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
            </Col>
            <Col md={4}>
              <Button
                variant="success"
                type="submit"
                className="w-100 d-flex align-items-center justify-content-center gap-1"
                disabled={adding || !newCategoryName.trim()}
              >
                {adding ? <Spinner animation="border" size="sm" /> : <Plus size={16} />}
                <span>Tạo danh mục</span>
              </Button>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Categories List Table */}
      <div className="admin-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Danh sách danh mục hiện có</h5>
            <p className="text-secondary small mb-0">
              Quản lý phân loại sản phẩm trên sàn CleanMarket
            </p>
          </div>
          <Badge bg="success" pill className="px-3 py-2">
            {categories.length} danh mục
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-4 text-secondary">
            Chưa có danh mục nào được thiết lập.
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Trạng thái hiển thị</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((item) => (
                <tr key={item.id} className={!item.active ? 'table-secondary opacity-75' : ''}>
                  <td className="small text-secondary">#{item.id}</td>
                  <td>
                    <strong className="text-dark fs-6">{item.name}</strong>
                  </td>
                  <td>
                    {item.active ? (
                      <span className="badge bg-success d-inline-flex align-items-center gap-1">
                        <Eye size={12} /> Đang hiển thị
                      </span>
                    ) : (
                      <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
                        <EyeOff size={12} /> Đã ẩn
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="d-flex align-items-center gap-1 px-2 py-1"
                        onClick={() => {
                          setEditCategory(item)
                          setEditName(item.name)
                        }}
                      >
                        <Edit size={13} />
                        <span>Đổi tên</span>
                      </Button>
                      <Button
                        variant={item.active ? 'outline-secondary' : 'outline-success'}
                        size="sm"
                        className="d-flex align-items-center gap-1 px-2 py-1"
                        onClick={() => handleToggleStatus(item)}
                      >
                        {item.active ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{item.active ? 'Ẩn' : 'Hiện'}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Rename Category Modal */}
      <Modal show={Boolean(editCategory)} onHide={() => setEditCategory(null)} centered>
        <Form onSubmit={handleSaveRename}>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Đổi tên danh mục</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="small fw-bold">Tên danh mục mới</Form.Label>
              <Form.Control
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nhập tên mới..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setEditCategory(null)}>
              Hủy
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={savingEdit || !editName.trim()}>
              {savingEdit ? <Spinner animation="border" size="sm" /> : 'Lưu thay đổi'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
