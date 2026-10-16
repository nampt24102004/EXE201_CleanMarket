import RatingSummary from './RatingSummary'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import formatCurrency from '../../utils/formatCurrency'
import confetti from 'canvas-confetti'
import { ShoppingBag, Eye, CheckCircle2, Store, Sparkles, ShieldCheck } from 'lucide-react'

function ProductCard({ product, onSelectProduct, onAddToCart }) {
  const [added, setAdded] = useState(false)

  const handlePreview = () => {
    onSelectProduct(product)
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    onAddToCart(product)

    // Trigger sweet organic confetti celebration!
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (rect.left + rect.width / 2) / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { x, y },
      colors: ['#22c55e', '#16a34a', '#84cc16', '#facc15', '#ffffff'],
      disableForReducedMotion: true,
      scalar: 0.8,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className="product-card">
      {/* Media & Badges */}
      <div className="product-card-media" onClick={handlePreview} role="button" tabIndex={0}>
        <img
          src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
        />
        <div className="product-badge-overlay">
          <span className="badge-tag-organic">
            <Sparkles size={11} className="text-success" />
            {product.category || 'Hữu cơ'}
          </span>
          {product.vietgapCertificate && (
            <span className="badge-tag-organic bg-white text-dark shadow-sm">
              <ShieldCheck size={11} className="text-primary" />
              VietGAP
            </span>
          )}
        </div>
        {product.stock > 0 ? (
          <span className="badge-tag-stock">
            Còn {product.stock} {product.unit}
          </span>
        ) : (
          <span className="badge-tag-stock bg-danger">Hết hàng</span>
        )}
      </div>

      {/* Body Content */}
      <div className="product-card-body">
        {/* Highlighted Supplier with Corner Verified 'V' Icon */}
        <div className="product-supplier-highlight">
          <Link
            to={`/suppliers/${product.supplierId}`}
            className="supplier-brand-link"
            title={`Xem gian hàng ${product.supplierName || 'nhà cung cấp'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Store size={15} className="text-success flex-shrink-0" />
            <span className="text-truncate">{product.supplierName || 'Nhà cung cấp đã xác minh'}</span>
          </Link>

          {/* Icon V at right corner with hover expansion to "Đã xác minh" */}
          <div
            className="verified-v-badge"
            title="Nhà cung cấp đã xác minh đạt chuẩn VietGAP"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="verified-v-icon">✓</span>
            <span className="verified-v-text">Đã xác minh</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="product-title" onClick={handlePreview} title={product.name}>
          {product.name}
        </h3>
        <RatingSummary rating={product.averageRating} count={product.reviewCount} className="mb-1" />

        {/* Short Description */}
        <p className="text-muted small mb-3 text-truncate">
          {product.shortDescription || 'Nông sản thu hoạch sớm, chuẩn an toàn vệ sinh.'}
        </p>

        {/* Price & Action Box */}
        <div className="product-price-box">
          <div>
            <div className="product-price">{formatCurrency(product.price)}</div>
            <div className="product-unit">Tính trên {product.unit}</div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-success rounded-pill px-3 py-2 d-flex align-items-center gap-1 fw-bold"
              onClick={handlePreview}
            >
              <Eye size={15} />
              <span>Xem</span>
            </button>

            <button
              type="button"
              className={`btn-quick-cart ${added ? 'bg-success text-white' : ''}`}
              onClick={handleAddToCart}
              title="Thêm vào giỏ hàng"
            >
              {added ? <CheckCircle2 size={18} /> : <ShoppingBag size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
