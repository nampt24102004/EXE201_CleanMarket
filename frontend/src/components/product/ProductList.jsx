import { Col, Row } from 'react-bootstrap'
import ProductCard from './ProductCard'

function ProductList({ products, onSelectProduct, onAddToCart }) {
  return (
    <section id="products" className="py-4">
      <Row className="g-4">
        {products.map((product) => (
          <Col key={product.id} md={6} xl={4}>
            <ProductCard
              product={product}
              onSelectProduct={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          </Col>
        ))}
      </Row>
    </section>
  )
}

export default ProductList
