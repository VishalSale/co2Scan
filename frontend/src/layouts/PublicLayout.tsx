import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const PublicLayout = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-custom">
        <div className="container-fluid px-4">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <i className="bi bi-leaf me-2" style={{ fontSize: '28px' }} />
            <span style={{ fontSize: '24px', fontWeight: '700' }}>co2Scan</span>
          </Link>
          
          <button 
            className="navbar-toggler border-0" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            style={{ color: 'var(--text)' }}
          >
            <i className="bi bi-list" style={{ fontSize: '28px', color: 'var(--text)' }} />
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center gap-1">
              <li className="nav-item">
                <Link to="/" className="nav-link px-3">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/pricing" className="nav-link px-3">Pricing</Link>
              </li>
              
              {isAuthenticated && user ? (
                <>
                  <li className="nav-item">
                    <Link to="/dashboard" className="nav-link px-3">Dashboard</Link>
                  </li>
                  <li className="nav-item dropdown">
                    <div 
                      className="profile-dropdown"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <div className="profile-avatar">
                        {getInitials(user.name)}
                      </div>
                      <div className="profile-info d-none d-lg-block">
                        <div className="profile-name">{user.name}</div>
                        <div className="profile-plan">{user.planType === 'GO' ? '⭐ GO' : '🆓 Free'}</div>
                      </div>
                      <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} ms-2`} />
                    </div>
                    
                    {dropdownOpen && (
                      <div className="profile-dropdown-menu">
                        <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <i className="bi bi-person me-2" />
                          Profile
                        </Link>
                        <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <i className="bi bi-gear me-2" />
                          Settings
                        </Link>
                        <Link to="/billing" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <i className="bi bi-credit-card me-2" />
                          Billing
                        </Link>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link px-3">Login</Link>
                  </li>
                  <li className="nav-item ms-2">
                    <Link to="/register">
                      <button className="glow-btn">Get Started</button>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}

export default PublicLayout
