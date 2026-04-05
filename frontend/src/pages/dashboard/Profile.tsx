import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'

const Profile = () => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // profile fields
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [profileImg, setProfileImg] = useState<string>('')

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      const data = await apiService.getProfile(user?.type ?? 'free')
      setProfile(data)
      setName(data.name || '')
      setMobile(data.mobile || '')
      setProfileImg(data.profileImg || '')
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfileImg(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProfileImg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await apiService.updateProfile(user?.type ?? 'free', { name, mobile: mobile || null, profileImg: profileImg || null })
      setSuccess('Profile updated successfully')
      setEditing(false)
      await loadProfile()
    } catch (err: any) {
      const data = err.response?.data
      if (data?.errors) {
        setError(Object.values(data.errors)[0] as string)
      } else {
        setError(data?.message || 'Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setError('')
    setSuccess('')
    setName(profile?.name || '')
    setMobile(profile?.mobile || '')
    setProfileImg(profile?.profileImg || '')
  }

  if (loading) return <LoadingSpinner />

  const displayImg = editing ? profileImg : profile?.profileImg

  return (
    <div className="fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="mb-4">Profile</h2>

          {/* Profile Card */}
          <div className="glass-card mb-4">
            <div className="d-flex align-items-center mb-4 gap-3">
              <div className="position-relative" style={{ width: 80, height: 80 }}>
                {displayImg ? (
                  <img src={displayImg} alt="Profile" className="rounded-circle object-fit-cover" style={{ width: 80, height: 80 }} />
                ) : (
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, fontSize: 32 }}>
                    <i className="bi bi-person-fill" />
                  </div>
                )}
                {editing && (
                  <button type="button" className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle p-1"
                    style={{ width: 26, height: 26, lineHeight: 1 }} onClick={() => fileInputRef.current?.click()} title="Change photo">
                    <i className="bi bi-camera-fill" style={{ fontSize: 12 }} />
                  </button>
                )}
              </div>
              <div>
                <h4 className="mb-1">{profile?.name}</h4>
                <p className="text-muted mb-1">{profile?.email}</p>
                <span className={`badge ${user?.type === 'go' ? 'bg-primary' : 'bg-secondary'}`}>
                  {user?.type === 'go' ? '⭐ GO Plan' : '🆓 Free Plan'}
                </span>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleImageChange} />

            {success && <div className="alert alert-success"><i className="bi bi-check-circle me-2" />{success}</div>}
            {error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2" />{error}</div>}

            {editing ? (
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mobile</label>
                  <input type="text" className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={saving} placeholder="Optional" />
                </div>
                <div className="mb-4">
                  <label className="form-label">Profile Photo</label>
                  <div className="d-flex gap-2 align-items-center">
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                      <i className="bi bi-upload me-1" />{profileImg ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {profileImg && (
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleRemoveImage} disabled={saving}>
                        <i className="bi bi-trash me-1" />Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="glow-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={handleCancel} disabled={saving}>Cancel</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="stat-card">
                      <small className="text-muted">Name</small>
                      <h6 className="mb-0">{profile?.name}</h6>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="stat-card">
                      <small className="text-muted">Mobile</small>
                      <h6 className="mb-0">{profile?.mobile || '—'}</h6>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="stat-card">
                      <small className="text-muted">Email</small>
                      <h6 className="mb-0">{profile?.email}</h6>
                    </div>
                  </div>
                  {/* <div className="col-md-6">
                    <div className="stat-card">
                      <small className="text-muted">Plan</small>
                      <h6 className="mb-0">{user?.type === 'go' ? 'GO Plan' : 'Free Plan'}</h6>
                    </div>
                  </div> */}
                </div>
                <button className="glow-btn" onClick={() => setEditing(true)}>
                  <i className="bi bi-pencil me-2" />Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
