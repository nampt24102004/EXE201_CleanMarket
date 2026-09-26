import { Badge, Button, Card, Stack } from 'react-bootstrap'
import formatCurrency from '../../utils/formatCurrency'
import { Link } from 'react-router-dom'

function ProductCard({ product, onSelectProduct, onAddToCart }) {
  const handlePreview = () => {
    onSelectProduct(product)
  }

  return (
    <Card className="product-card border-0">
      <Card.Img
        variant="top"
        src={product.image}
        alt={product.name}
        className="product-card-image"
        role="button"
        tabIndex={0}
        onClick={handlePreview}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handlePreview()
          }
        }}
      />
      <Card.Body className="d-flex flex-column">
        <Stack direction="horizontal" className="justify-content-between mb-3">
          <Badge pill className="organic-badge">
            Organic
          </Badge>
          <span className="fw-semibold text-success">{product.unit}</span>
        </Stack>
        <Card.Title>{product.name}</Card.Title>
        <Card.Text className="text-secondary">{product.shortDescription}</Card.Text>
        <Card.Text className="small text-success mb-3"><Link to={`/suppliers/${product.supplierId}`}>{product.supplierName}</Link> · Đã xác minh</Card.Text>
        <div className="mt-auto">
          <div className="fw-bold fs-5 mb-3">{formatCurrency(product.price)}</div>
          <Stack gap={2}>
            <Button className="primary-btn w-100" onClick={handlePreview}>
              Xem chi tiết
            </Button>
            <Button variant="outline-success" className="rounded-pill" onClick={() => onAddToCart(product)}>
              Thêm vào giỏ
            </Button>
          </Stack>
        </div>
      </Card.Body>
    </Card>
  )
}

export default ProductCard
