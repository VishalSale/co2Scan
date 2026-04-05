import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'

interface CrawlState {
  jobId: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  progress?: {
    totalPages: number | string
    running: number
    completed: number
    pending: number
    failed: number
  }
}

const ScanWebsite = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [crawl, setCrawl] = useState<CrawlState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startPolling = (jobId: string) => {
    stopPolling()
    intervalRef.current = setInterval(async () => {
      try {
        const res = await apiService.getCrawlStatus(jobId)

        setCrawl({
          jobId,
          status: res.status,
          progress: res.progress,
        })

        if (res.status === 'completed') {
          stopPolling()
          setLoading(false)
          // go tier completed — navigate to crawl report page
          navigate('/crawl-report', { state: { report: res.report } })
        } else if (res.status === 'failed') {
          stopPolling()
          setLoading(false)
          setError('Crawl failed. Please try again.')
        } else if (res.status === 'paused') {
          // stop polling when paused — user must resume manually
          stopPolling()
          setLoading(false)
        }
      } catch (err: any) {
        if (err.response?.status === 500) {
          stopPolling()
          setLoading(false)
          setCrawl(prev => prev ? { ...prev, status: 'failed' } : prev)
          setError(err.response?.data?.error || 'Crawl failed on server. Please try again.')
        } else if (err.response?.status === 404) {
          stopPolling()
          setLoading(false)
          setError('Crawl job not found.')
        } else if (err.response?.status === 403) {
          stopPolling()
          setLoading(false)
          setError('Access denied. GO plan required.')
        }
        // network blip — keep polling silently
      }
    }, 4000)
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCrawl(null)
    setLoading(true)

    try {
      const result = await apiService.scanWebsite(url, user?.type ?? 'free')

      if (user?.type === 'go') {
        // cached completed job comes back immediately
        if (result.status === 'completed') {
          setLoading(false)
          navigate('/crawl-report', { state: { report: result.report } })
          return
        }
        // new job — start polling
        const jobId = result.jobId
        setCrawl({ jobId, status: 'pending' })
        startPolling(jobId)
      } else {
        // free tier — instant report
        setLoading(false)
        navigate('/scan-result', { state: { result, url } })
      }
    } catch (err: any) {
      setLoading(false)
      if (err.response?.status === 429) {
        setError(err.response.data.message || 'Rate limit exceeded')
      } else if (err.response?.status === 403) {
        setError(err.response.data.message || 'Access denied')
      } else {
        setError(err.response?.data?.message || 'Failed to scan website')
      }
    }
  }

  const handlePause = async () => {
    if (!crawl?.jobId) return
    setActionLoading(true)
    try {
      await apiService.pauseCrawl(crawl.jobId)
      stopPolling()
      setCrawl(prev => prev ? { ...prev, status: 'paused' } : prev)
      setLoading(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to pause crawl')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    if (!crawl?.jobId) return
    setActionLoading(true)
    setError('')
    try {
      await apiService.resumeCrawl(crawl.jobId)
      setCrawl(prev => prev ? { ...prev, status: 'running' } : prev)
      setLoading(true)
      startPolling(crawl.jobId)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resume crawl')
    } finally {
      setActionLoading(false)
    }
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-secondary',
    running: 'bg-primary',
    paused: 'bg-warning',
    completed: 'bg-success',
    failed: 'bg-danger',
  }

  return (
    <div className="fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="text-center mb-5">
            <h2 className="mb-3">Scan Website</h2>
            <p className="text-muted">
              {user?.type === 'go'
                ? 'Full site crawl — every page analyzed for carbon footprint'
                : 'Single page scan with carbon footprint analysis and recommendations'}
            </p>
          </div>

          <div className="glass-card mb-4">
            <form onSubmit={handleScan}>
              <div className="mb-4">
                <label className="form-label">Website URL</label>
                <input
                  type="url"
                  className="form-control form-control-lg"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                />
                <small className="text-muted">Enter the full URL including https://</small>
              </div>

              {error && (
                <div className="alert alert-danger mb-4">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {error}
                  {error.includes('Rate limit') && user?.type === 'free' && (
                    <div className="mt-2">
                      <button type="button" className="btn btn-sm btn-outline-light" onClick={() => navigate('/billing')}>
                        Upgrade to GO for unlimited scans
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="glow-btn w-100" disabled={loading}>
                {loading && !crawl ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Starting scan...</>
                ) : (
                  <><i className="bi bi-search me-2" />Scan Now</>
                )}
              </button>
            </form>

            {/* Free tier loading */}
            {loading && user?.type !== 'go' && (
              <div className="mt-4 text-center">
                <LoadingSpinner />
                <p className="text-muted mt-3">
                  Analyzing carbon emissions...
                  <br /><small>This may take 10–30 seconds</small>
                </p>
              </div>
            )}

            {/* Go tier crawl progress */}
            {crawl && (
              <div className="mt-4">
                {(crawl.status === 'running' || crawl.status === 'pending') && <LoadingSpinner />}

                <div className="stat-card mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Crawl Progress</h6>
                    <span className={`badge ${statusColor[crawl.status]} text-capitalize`}>{crawl.status}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Job ID</small>
                    <small className="text-primary">{crawl.jobId}</small>
                  </div>

                  {crawl.progress && (
                    <>
                      <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted">Pages Found</small>
                        <small>{crawl.progress.totalPages}</small>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted">Running</small>
                        <small className="text-success">{crawl.progress.running}</small>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted">Completed</small>
                        <small className="text-success">{crawl.progress.completed}</small>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted">Pending</small>
                        <small className="text-warning">{crawl.progress.pending}</small>
                      </div>
                      {crawl.progress.failed > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <small className="text-muted">Failed</small>
                          <small className="text-danger">{crawl.progress.failed}</small>
                        </div>
                      )}
                    </>
                  )}

                  {/* Pause / Resume controls */}
                  <div className="d-flex gap-2 mt-3">
                    {(crawl.status === 'running' || crawl.status === 'pending') && (
                      <button
                        className="btn btn-outline-warning btn-sm"
                        onClick={handlePause}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-pause-fill me-1" />}
                        Pause
                      </button>
                    )}
                    {crawl.status === 'paused' && (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleResume}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                        Resume
                      </button>
                    )}
                  </div>

                  {crawl.status === 'paused' && (
                    <p className="text-warning mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-info-circle me-1" />
                      Crawl is paused. Resume to continue scanning.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Plan info banners */}
          {user?.type === 'free' && (
            <div className="glass-card mt-4" style={{ borderColor: 'var(--warning)' }}>
              <div className="d-flex align-items-start">
                <i className="bi bi-info-circle text-warning me-3 fs-4" />
                <div>
                  <h6 className="mb-2">Free Plan — 10 scans/day</h6>
                  <p className="text-muted mb-0">
                    Upgrade to GO for unlimited full-site crawls with pause & resume.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user?.type === 'go' && (
            <div className="glass-card mt-4" style={{ borderColor: 'var(--primary)' }}>
              <div className="d-flex align-items-start">
                <i className="bi bi-rocket text-primary me-3 fs-4" />
                <div>
                  <h6 className="mb-2">GO Plan — Full Site Crawl</h6>
                  <p className="text-muted mb-0">
                    Every page scanned. Pause and resume anytime.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScanWebsite
