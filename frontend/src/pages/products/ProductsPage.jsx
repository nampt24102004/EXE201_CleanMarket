import { useMemo, useState } from 'react'
import { Alert, Col, Container, Form, Row } from 'react-bootstrap'
import PageTitle from '../../components/common/PageTitle'
import ProductList from '../../components/product/ProductList'

function ProductsPage({ products, onSelectProduct, onAddToCart }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [supplier, setSupplier] = useState('')
  const [sort, setSort] = useState('')
  const filtered = useMemo(() => {
    const result = products.filter((product) => product.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')) && (!category || product.category === category) && (!supplier || product.supplierId === supplier))
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    return result
  }, [products, query, category, supplier, sort])
  return (
    <Container className="py-4 py-md-5">
      <PageTitle
        eyebrow="Trang sản phẩm"
        title="Danh sách đầy đủ nông sản hữu cơ"
        description="Tìm nông sản sạch theo tên, danh mục và nhà cung cấp đã xác minh."
      />
      <Row className="g-3 mb-3"><Col md={5}><Form.Control aria-label="Tìm sản phẩm" placeholder="Tìm tên sản phẩm..." value={query} onChange={(e) => setQuery(e.target.value)} /></Col><Col md={2}><Form.Select aria-label="Danh mục" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Mọi danh mục</option>{[...new Set(products.map((item) => item.category))].map((item) => <option key={item}>{item}</option>)}</Form.Select></Col><Col md={3}><Form.Select aria-label="Nhà cung cấp" value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">Mọi nhà cung cấp</option>{[...new Map(products.map((item) => [item.supplierId, item.supplierName])).entries()].map(([id, name]) => <option value={id} key={id}>{name}</option>)}</Form.Select></Col><Col md={2}><Form.Select aria-label="Sắp xếp" value={sort} onChange={(e) => setSort(e.target.value)}><option value="">Mặc định</option><option value="price-asc">Giá tăng</option><option value="price-desc">Giá giảm</option></Form.Select></Col></Row>
      {filtered.length === 0 && <Alert variant="info">Không có sản phẩm phù hợp với bộ lọc.</Alert>}
      <ProductList
        products={filtered}
        onSelectProduct={onSelectProduct}
        onAddToCart={onAddToCart}
      />
    </Container>
  )
}

export default ProductsPage
