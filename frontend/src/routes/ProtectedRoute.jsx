import { Navigate, useLocation } from 'react-router-dom'
import { Container, Spinner } from 'react-bootstrap'
import { useAuth } from '../context/useAuth'
import { homeFor } from '../utils/authRoutes'

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="success" /><div className="mt-2">Đang kiểm tra phiên đăng nhập...</div></Container>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  const assigned = user.roles?.length ? user.roles : [user.role]
  if (roles && !roles.some((role) => assigned.includes(role))) {
    // Usually the account changed (logout, or another account logged in from another tab): send them to their own area.
    const home = homeFor(user)
    return <Navigate to={home === location.pathname ? '/403' : home} replace />
  }
  return children
}
