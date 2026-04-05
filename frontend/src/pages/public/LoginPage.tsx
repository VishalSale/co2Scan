import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await apiService.login(email, password)
      // Backend sets cookie automatically
      // Now fetch the full user data from the /me endpoint
      try {
        const meResponse = await apiService.checkAuth()
        const userData = meResponse?.user || {
          id: 0,
          name: email.split('@')[0],
          email: email,
          type: 'free' as const,
          status: 'active' as const,
        }
        login(userData)
      } catch (meError) {
        // If /me endpoint fails, use basic user data
        const userData = {
          id: 0,
          name: email.split('@')[0],
          email: email,
          type: 'free' as const,
          status: 'active' as const,
        }
        login(userData)
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError('Email or password is incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="glass-card fade-in">
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted">Login to your account</p>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="glow-btn w-100 mb-3" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center">
                <p className="text-muted mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
