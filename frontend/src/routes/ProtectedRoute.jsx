import { Navigate, useLocation } from 'react-router-dom'
import { Container, Spinner } from 'react-bootstrap'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="success" /><div className="mt-2">Đang kiểm tra phiên đăng nhập...</div></Container>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />
  return children
}