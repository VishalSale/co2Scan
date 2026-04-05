import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'

const Settings = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters with uppercase, lowercase and special character')
      return
    }

    setLoading(true)

    try {
      await apiService.changePassword(user?.type ?? 'free', { oldPassword, newPassword, confirmPassword })
      setSuccess('Password changed successfully. Redirecting to login...')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implement account deletion
      alert('Account deletion feature coming soon')
    }
  }

  return (
    <div className="fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="mb-4">Settings</h2>

          {/* Change Password */}
          <div className="glass-card mb-4">
            <h5 className="mb-4">Change Password</h5>

            {success && (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2" />
                {success}
              </div>
            )}

            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="glow-btn" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Notifications */}
          <div className="glass-card mb-4">
            <h5 className="mb-4">Notifications</h5>
            <div className="form-check form-switch mb-3">
              <input className="form-check-input" type="checkbox" id="emailNotif" defaultChecked />
              <label className="form-check-label" htmlFor="emailNotif">
                Email notifications for scan results
              </label>
            </div>
            <div className="form-check form-switch mb-3">
              <input className="form-check-input" type="checkbox" id="weeklyReport" />
              <label className="form-check-label" htmlFor="weeklyReport">
                Weekly carbon report summary
              </label>
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="marketing" />
              <label className="form-check-label" htmlFor="marketing">
                Marketing and product updates
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card border-danger">
            <h5 className="text-danger mb-4">
              <i className="bi bi-exclamation-triangle me-2" />
              Danger Zone
            </h5>
            
            <div className="mb-3">
              <h6>Logout</h6>
              <p className="text-muted mb-2">Sign out from your account</p>
              <button 
                className="btn btn-outline-warning"
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
              >
                <i className="bi bi-box-arrow-right me-2" />
                Logout
              </button>
            </div>

            <hr className="my-4" />

            <div>
              <h6>Delete Account</h6>
              <p className="text-muted mb-2">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button className="btn btn-outline-danger" onClick={handleDeleteAccount}>
                <i className="bi bi-trash me-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
