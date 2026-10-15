import { Link } from 'react-router-dom'

export default function BrandLogo({
  to = '/',
  size = 'md',
  showTagline = true,
  theme = 'light',
  className = '',
  asLink = true,
}) {
  const sizeMap = {
    sm: { icon: 34, title: '1.25rem', tag: '0.58rem' },
    md: { icon: 42, title: '1.45rem', tag: '0.62rem' },
    lg: { icon: 54, title: '1.85rem', tag: '0.72rem' },
  }

  const currentSize = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`brand-logo-container brand-size-${size} brand-theme-${theme} ${className}`}>
      <img
        src="/logo-icon.png"
        alt="CleanMarket"
        className="brand-emblem-img"
        style={{
          width: `${currentSize.icon}px`,
          height: `${currentSize.icon}px`,
          objectFit: 'contain',
        }}
      />
      <div className="brand-text-block">
        <div className="brand-title-line" style={{ fontSize: currentSize.title }}>
          <span className="brand-word-clean">Clean</span>
          <span className="brand-word-market">Market</span>
        </div>
        {showTagline && (
          <div className="brand-tagline-text" style={{ fontSize: currentSize.tag }}>
            THỰC PHẨM SẠCH &amp; TỰ NHIÊN
          </div>
        )}
      </div>
    </div>
  )

  if (asLink) {
    return (
      <Link to={to} className="brand-logo-link text-decoration-none">
        {content}
      </Link>
    )
  }

  return content
}
