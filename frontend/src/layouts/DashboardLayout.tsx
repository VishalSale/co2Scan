import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/scan', icon: 'bi-search', label: 'Scan Website' },
    { path: '/history', icon: 'bi-clock-history', label: 'Scan History' },
    { path: '/analytics', icon: 'bi-graph-up', label: 'Analytics' },
    { path: '/export', icon: 'bi-download', label: 'Export Report' },
  ]

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="px-4 mb-4">
          <Link to="/" className="navbar-brand d-flex align-items-center mb-0">
            <i className="bi bi-leaf me-2" style={{ fontSize: '24px' }} />
            <span style={{ fontSize: '20px', fontWeight: '700' }}>co2Scan</span>
          </Link>
          <div className="mt-2">
            <small className="text-muted">
              {user?.type === 'go' ? '⭐ GO Plan' : '🆓 Free Plan'}
            </small>
          </div>
        </div>

        <nav className="flex-grow-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <i className={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right side: header + content */}
      <div className="dashboard-right">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-title">
            {/* Page title could go here if needed */}
          </div>
          <div className="ms-auto" ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              className="profile-dropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="profile-avatar">
                {user && getInitials(user.name)}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.name}</div>
                <div className="profile-plan">{user?.type === 'go' ? '⭐ GO Plan' : '🆓 Free Plan'}</div>
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
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
