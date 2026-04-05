import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'

interface ScanRow {
  id: string
  url: string
  grade: string
  carbonScore: number
  co2Grams: number
  pageSizeMb: number
  createdAt: string
  type: 'crawl' | 'single'
  status?: string
  pagesScanned?: number
  totalPages?: number
}

const ScanHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scans, setScans] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string>('')
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 })

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await apiService.getScanHistory(user?.type ?? 'free', currentPage, itemsPerPage)
      const data = response?.data || []
      const paginationData = response?.pagination

      if (user?.type === 'go') {
        setScans(data.map((crawl: any) => ({
          id: String(crawl.id),
          url: crawl.rootUrl,
          grade: crawl.reportJson?.summary?.grade || 'N/A',
          carbonScore: crawl.reportJson?.summary?.averageCarbonScore || 0,
          co2Grams: crawl.reportJson?.summary?.averageCo2 || 0,
          pageSizeMb: crawl.reportJson?.summary?.averagePageSizeMb || 0,
          createdAt: crawl.createdAt,
          status: crawl.status,
          pagesScanned: crawl.pagesScanned,
          totalPages: crawl.totalPages,
          type: 'crawl' as const,
        })))
      } else {
        setScans(data.map((scan: any) => ({
          id: String(scan.id),
          url: scan.url,
          grade: scan.grade || scan.reportJson?.summary?.grade || 'N/A',
          carbonScore: scan.carbonScore ?? scan.reportJson?.summary?.carbonScore ?? 0,
          co2Grams: scan.co2Grams ?? scan.reportJson?.summary?.co2Grams ?? 0,
          pageSizeMb: scan.pageSizeMb ?? scan.reportJson?.summary?.pageSizeMb ?? 0,
          createdAt: scan.createdAt,
          type: 'single' as const,
        })))
      }

      if (paginationData) {
        setPagination({ totalPages: paginationData.totalPages, total: paginationData.total })
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.type, currentPage, itemsPerPage])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handlePause = async (scanId: string) => {
    setActionId(scanId)
    setActionError('')
    try {
      await apiService.pauseCrawlFromHistory(scanId)
      setScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'paused' } : s))
      await loadHistory(true)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to pause crawl')
    } finally {
      setActionId(null)
    }
  }

  const handleResume = async (scanId: string) => {
    setActionId(scanId)
    setActionError('')
    try {
      await apiService.resumeCrawlFromHistory(scanId)
      setScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'running' } : s))
      await loadHistory(true)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to resume crawl')
    } finally {
      setActionId(null)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
  }

  const filteredScans = scans.filter(scan => {
    if (filter === 'all') return true
    return scan.grade.startsWith(filter)
  })

  const isGo = user?.type === 'go'

  // Derive global state for the "all" toggle button
  const hasAnyRunning = scans.some(s => s.status === 'running' || s.status === 'pending')
  const hasAnyPaused = scans.some(s => s.status === 'paused')
  const showGlobalToggle = isGo && (hasAnyRunning || hasAnyPaused)

  const handleToggleAll = async () => {
    setActionId('__all__')
    setActionError('')
    try {
      if (hasAnyRunning) {
        await apiService.pauseAllCrawls()
        setScans(prev => prev.map(s =>
          (s.status === 'running' || s.status === 'pending') ? { ...s, status: 'paused' } : s
        ))
      } else {
        await apiService.resumeAllCrawls()
        setScans(prev => prev.map(s =>
          s.status === 'paused' ? { ...s, status: 'running' } : s
        ))
      }
      await loadHistory(true)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Action failed')
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Scan History</h2>
          <p className="text-muted mb-0">
            {user?.type === 'free' ? 'Last 10 scans' : 'All your scans'}
          </p>
        </div>
        <div className="d-flex gap-2">
          {showGlobalToggle && (
            <button
              className={`btn ${hasAnyRunning ? 'btn-outline-warning' : 'btn-outline-success'}`}
              disabled={actionId === '__all__'}
              onClick={handleToggleAll}
            >
              {actionId === '__all__'
                ? <><span className="spinner-border spinner-border-sm me-1" />{hasAnyRunning ? 'Pausing...' : 'Resuming...'}</>
                : hasAnyRunning
                  ? <><i className="bi bi-pause-fill me-1" />Pause All</>
                  : <><i className="bi bi-play-fill me-1" />Resume All</>
              }
            </button>
          )}
          <button className="glow-btn" onClick={() => navigate('/scan')}>
            <i className="bi bi-plus-lg me-2" />
            New Scan
          </button>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="alert alert-danger alert-dismissible mb-4">
          <i className="bi bi-exclamation-triangle me-2" />
          {actionError}
          <button className="btn-close" onClick={() => setActionError('')} />
        </div>
      )}

      {/* Filters */}
      <div className="glass-card mb-4">
        <div className="d-flex gap-2 flex-wrap">
          {['all', 'A', 'B', 'C', 'D', 'F'].map(f => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : `Grade ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* Scans Table */}
      <div className="glass-card">
        {filteredScans.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted mb-3" />
            <h5 className="text-muted">No scans found</h5>
            <p className="text-muted mb-4">
              {filter === 'all' ? 'Start by scanning your first website' : 'No scans match this filter'}
            </p>
            <button className="glow-btn" onClick={() => navigate('/scan')}>Scan Now</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Website URL</th>
                  {isGo && <th>Status</th>}
                  {isGo && <th>Pages</th>}
                  <th>Grade</th>
                  <th>Carbon Score</th>
                  <th>CO₂</th>
                  <th>Page Size</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => {
                  const isActioning = actionId === scan.id
                  const canPause = isGo && (scan.status === 'running' || scan.status === 'pending')
                  const canResume = isGo && scan.status === 'paused'

                  return (
                    <tr key={scan.id}>
                      <td>
                        <i className="bi bi-globe me-2 text-primary" />
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '260px' }}>
                          {scan.url}
                        </span>
                      </td>

                      {isGo && (
                        <td>
                          <span className={`badge ${
                            scan.status === 'completed' ? 'bg-success' :
                            scan.status === 'failed'    ? 'bg-danger' :
                            scan.status === 'paused'   ? 'bg-warning text-dark' :
                            scan.status === 'running'  ? 'bg-primary' :
                            'bg-secondary'
                          }`}>
                            {scan.status || 'N/A'}
                          </span>
                        </td>
                      )}

                      {isGo && (
                        <td>
                          {scan.type === 'crawl'
                            ? `${scan.pagesScanned ?? 0}/${scan.totalPages ?? 0}`
                            : '1/1'}
                        </td>
                      )}

                      <td>
                        <span className={`badge badge-custom grade-${scan.grade[0]}`}>
                          {scan.grade}
                        </span>
                      </td>
                      <td><span className="fw-bold">{scan.carbonScore}</span></td>
                      <td>{Number(scan.co2Grams).toFixed(2)}g</td>
                      <td>{scan.pageSizeMb} MB</td>
                      <td><small>{new Date(scan.createdAt).toLocaleString()}</small></td>

                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {/* View button */}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(
                              isGo && scan.type === 'crawl'
                                ? `/crawl-details/${scan.id}`
                                : `/report/${scan.id}`
                            )}
                          >
                            <i className="bi bi-eye me-1" />View
                          </button>

                          {/* Single toggle: Pause when running, Resume when paused */}
                          {(canPause || canResume) && (
                            <button
                              className={`btn btn-sm ${canPause ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              disabled={isActioning}
                              onClick={() => canPause ? handlePause(scan.id) : handleResume(scan.id)}
                            >
                              {isActioning
                                ? <><span className="spinner-border spinner-border-sm me-1" />{canPause ? 'Pausing...' : 'Resuming...'}</>
                                : canPause
                                  ? <><i className="bi bi-pause-fill me-1" />Pause</>
                                  : <><i className="bi bi-play-fill me-1" />Resume</>
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {scans.length > 0 && (
        <div className="glass-card mt-4">
          <div className="row align-items-center">
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Show:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-muted">
                  {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total}
                </span>
              </div>
            </div>
            <div className="col-md-8">
              <nav>
                <ul className="pagination justify-content-end mb-0">
                  <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                      <i className="bi bi-chevron-left" />
                    </button>
                  </li>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) pageNum = i + 1
                    else if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
                    else pageNum = currentPage - 2 + i
                    return (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pageNum)}>{pageNum}</button>
                      </li>
                    )
                  })}
                  <li className={`page-item ${currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.totalPages}>
                      <i className="bi bi-chevron-right" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Banner */}
      {user?.type === 'free' && pagination.total >= 10 && (
        <div className="glass-card mt-4 border-primary">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h5 className="mb-2">
                <i className="bi bi-lock-fill text-primary me-2" />Unlock Full History
              </h5>
              <p className="text-muted mb-0">Upgrade to GO to access unlimited scan history and advanced analytics</p>
            </div>
            <div className="col-md-4 text-end">
              <button className="glow-btn" onClick={() => navigate('/billing')}>Upgrade to GO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScanHistory
