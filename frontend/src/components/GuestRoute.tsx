import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const GuestRoute = () => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default GuestRoute
