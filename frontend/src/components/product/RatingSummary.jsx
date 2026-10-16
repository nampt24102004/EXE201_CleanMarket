import { Star } from 'lucide-react'

// Average review score with the number of reviews; shows a quiet placeholder when nobody has reviewed yet.
export default function RatingSummary({ rating, count = 0, className = '' }) {
  if (!count) return <div className={`small text-secondary ${className}`}>Chưa có đánh giá</div>
  return (
    <div className={`small d-flex align-items-center gap-1 ${className}`} title={`${rating}/5 từ ${count} đánh giá`}>
      <Star size={14} fill="#f5a623" color="#f5a623" />
      <strong className="text-dark">{Number(rating).toFixed(1)}</strong>
      <span className="text-secondary">({count} đánh giá)</span>
    </div>
  )
}
