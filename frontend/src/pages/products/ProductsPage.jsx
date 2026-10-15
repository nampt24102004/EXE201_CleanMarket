import { useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap'
import ProductList from '../../components/product/ProductList'
import { Search, Filter, X } from 'lucide-react'

function ProductsPage({ products, onSelectProduct, onAddToCart }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [supplier, setSupplier] = useState('')
  const [sort, setSort] = useState('')

  const categories = useMemo(() => {
    return [...new Set(products.map((item) => item.category).filter(Boolean))]
  }, [products])

  const suppliers = useMemo(() => {
    return [...new Map(products.map((item) => [item.supplierId, item.supplierName])).entries()].filter(([id]) => id)
  }, [products])

  const filtered = useMemo(() => {
    const result = products.filter(
      (product) =>
        product.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')) &&
        (!category || product.category === category) &&
        (!supplier || String(product.supplierId) === String(supplier))
    )
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    return result
  }, [products, query, category, supplier, sort])

  const hasActiveFilters = Boolean(query || category || supplier || sort)

  const clearFilters = () => {
    setQuery('')
    setCategory('')
    setSupplier('')
    setSort('')
  }

  return (
    <Container className="py-4 py-md-5">
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
        <div>
          <div className="hero-kicker mb-2">Danh mục nông sản đạt chuẩn</div>
          <h1 className="section-title mb-1">
            Nông sản sạch <span className="gradient-text">tươi mới mỗi ngày</span>
          </h1>
          <p className="text-secondary mb-0">
            Tra cứu nguồn gốc, nhà cung cấp và chứng nhận VietGAP của từng nông sản.
          </p>
        </div>

        <Badge bg="success" pill className="px-3 py-2 fs-6 fw-bold">
          {filtered.length} sản phẩm sẵn sàng
        </Badge>
      </div>

      {/* Filter Toolbar Card */}
      <Card className="detail-card border-0 p-3 p-md-4 mb-4">
        <Row className="g-3 align-items-center">
          {/* Search Input */}
          <Col md={4} lg={4}>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <Search size={18} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                className="border-start-0 ps-0"
                placeholder="Tìm tên rau, củ, quả..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <Button variant="light" className="border" onClick={() => setQuery('')}>
                  <X size={16} />
                </Button>
              )}
            </InputGroup>
          </Col>

          {/* Category Dropdown */}
          <Col sm={6} md={3} lg={3}>
            <Form.Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="fw-semibold"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Supplier Dropdown */}
          <Col sm={6} md={3} lg={3}>
            <Form.Select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="fw-semibold"
            >
              <option value="">Tất cả nông trại</option>
              {suppliers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Sort Dropdown */}
          <Col sm={6} md={2} lg={2}>
            <Form.Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="fw-semibold"
            >
              <option value="">Sắp xếp</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </Form.Select>
          </Col>
        </Row>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="d-flex align-items-center gap-2 flex-wrap mt-3 pt-3 border-top">
            <span className="small text-muted fw-semibold">Đang lọc:</span>
            {query && (
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                Từ khóa: "{query}"
                <X size={12} className="cursor-pointer" onClick={() => setQuery('')} />
              </span>
            )}
            {category && (
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                Danh mục: {category}
                <X size={12} className="cursor-pointer" onClick={() => setCategory('')} />
              </span>
            )}
            {supplier && (
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                Nhà vườn: {suppliers.find(([id]) => String(id) === String(supplier))?.[1] || supplier}
                <X size={12} className="cursor-pointer" onClick={() => setSupplier('')} />
              </span>
            )}
            <Button
              variant="link"
              size="sm"
              className="p-0 text-danger text-decoration-none fw-semibold"
              onClick={clearFilters}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Card className="detail-card border-0 p-5 text-center my-4">
          <div className="mx-auto mb-3 text-muted">
            <Filter size={48} className="opacity-50" />
          </div>
          <h4 className="fw-bold mb-2">Không tìm thấy nông sản phù hợp</h4>
          <p className="text-secondary mb-4">
            Vui lòng thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
          </p>
          <div>
            <Button className="primary-btn" onClick={clearFilters}>
              Đặt lại tất cả bộ lọc
            </Button>
          </div>
        </Card>
      ) : (
        <ProductList
          products={filtered}
          onSelectProduct={onSelectProduct}
          onAddToCart={onAddToCart}
        />
      )}
    </Container>
  )
}

export default ProductsPage
