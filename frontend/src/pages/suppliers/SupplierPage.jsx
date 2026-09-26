import { Badge, Col, Container, Row } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import ProductCard from '../../components/product/ProductCard'

export default function SupplierPage({ products, suppliers, onSelectProduct, onAddToCart }) {
  const { id } = useParams()
  const supplier = suppliers.find((item) => String(item.id) === id)
  if (!supplier) return <Container className="py-5"><h1>Không tìm thấy nhà cung cấp</h1></Container>
  return <Container className="py-5"><div className="soft-panel p-4 p-md-5 mb-4"><Badge bg="success" className="mb-3">Đã xác minh</Badge><h1 className="section-title">{supplier.name}</h1><p className="mb-2">{supplier.location}</p><p className="mb-0 text-secondary">{supplier.description}</p></div><h2 className="h3 mb-4">Sản phẩm của nhà cung cấp</h2><Row className="g-4">{products.filter((item) => String(item.supplierId) === id).map((item) => <Col md={6} xl={4} key={item.id}><ProductCard product={item} onSelectProduct={onSelectProduct} onAddToCart={onAddToCart} /></Col>)}</Row></Container>
}