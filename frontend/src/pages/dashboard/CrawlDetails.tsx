import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'
import GradeBadge from '../../components/GradeBadge'

const CrawlDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [crawl, setCrawl] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedPage, setExpandedPage] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'pending' | 'running'>('all')
  const [retryingPageId, setRetryingPageId] = useState<number | null>(null)
  const [retryError, setRetryError] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    loadCrawlDetails()
  }, [id])

  const loadCrawlDetails = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const response = await apiService.getCrawlDetails(id!)
      if (!response) {
        setError('No data received from server')
        return
      }
      setCrawl(response)
    } catch (err: any) {
      console.error('Error loading crawl details:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load crawl details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (error || !crawl) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-exclamation-triangle display-1 text-danger mb-3" />
        <h3>{error || 'Crawl not found'}</h3>
        <button className="glow-btn mt-3" onClick={() => navigate('/history')}>
          Back to History
        </button>
      </div>
    )
  }

  const filteredPages = crawl.pages?.filter((page: any) => {
    if (filter === 'all') return true
    return page.status === filter
  }) || []

  const statusCounts = {
    completed: crawl.pages?.filter((p: any) => p.status === 'completed').length || 0,
    failed: crawl.pages?.filter((p: any) => p.status === 'failed').length || 0,
    pending: crawl.pages?.filter((p: any) => p.status === 'pending').length || 0,
    running: crawl.pages?.filter((p: any) => p.status === 'running').length || 0,
  }

  const togglePage = (index: number) => {
    setExpandedPage(expandedPage === index ? null : index)
  }

  const handleRetryPage = async (pageId: number) => {
    setRetryingPageId(pageId)
    setRetryError('')
    try {
      await apiService.retryFailedPage(String(pageId))
      await loadCrawlDetails(true)
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Retry failed'
      setRetryError(`Page ${pageId}: ${msg}`)
      console.error('Failed to retry page:', err)
    } finally {
      setRetryingPageId(null)
    }
  }

  const handlePauseCrawl = async () => {
    setActionLoading(true)
    setActionError('')
    try {
      await apiService.pauseCrawlFromHistory(id!)
      // Optimistically update so button flips immediately
      setCrawl((prev: any) => prev ? { ...prev, status: 'paused' } : prev)
      await loadCrawlDetails(true)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to pause crawl')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResumeCrawl = async () => {
    setActionLoading(true)
    setActionError('')
    try {
      await apiService.resumeCrawlFromHistory(id!)
      // Optimistically update so button flips immediately
      setCrawl((prev: any) => prev ? { ...prev, status: 'running' } : prev)
      await loadCrawlDetails(true)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to resume crawl')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="container-fluid">
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button className="btn btn-outline-secondary mb-2" onClick={() => navigate('/history')}>
              <i className="bi bi-arrow-left me-2" />
              Back to History
            </button>
            <h2 className="mb-1">Crawl Details</h2>
            <p className="text-muted mb-0">{crawl.rootUrl}</p>
            <small className="text-muted">
              Scanned on {new Date(crawl.createdAt).toLocaleString()}
            </small>
          </div>
          <div>
            <span className={`badge ${
              crawl.status === 'completed' ? 'bg-success' : 
              crawl.status === 'failed' ? 'bg-danger' : 
              crawl.status === 'paused' ? 'bg-warning' : 
              'bg-secondary'
            } fs-5`}>
              {crawl.status}
            </span>
            {(crawl.status === 'running' || crawl.status === 'pending') && (
              <button
                className="btn btn-outline-warning ms-3"
                disabled={actionLoading}
                onClick={handlePauseCrawl}
              >
                {actionLoading
                  ? <><span className="spinner-border spinner-border-sm me-1" />Pausing...</>
                  : <><i className="bi bi-pause-fill me-1" />Pause Crawl</>
                }
              </button>
            )}
            {crawl.status === 'paused' && (
              <button
                className="btn btn-outline-success ms-3"
                disabled={actionLoading}
                onClick={handleResumeCrawl}
              >
                {actionLoading
                  ? <><span className="spinner-border spinner-border-sm me-1" />Resuming...</>
                  : <><i className="bi bi-play-fill me-1" />Resume Crawl</>
                }
              </button>
            )}
            {actionError && (
              <div className="alert alert-danger mt-2 mb-0 py-1 px-2" style={{ fontSize: '0.85rem' }}>
                {actionError}
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-2">Overall Grade</h6>
              <GradeBadge grade={crawl.reportJson?.summary?.grade || 'N/A'} size={80} />
            </div>
          </div>
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-2">Average CO₂</h6>
              <h2 className="text-primary mb-0">
                {crawl.reportJson?.summary?.averageCo2?.toFixed(2) || '0.00'}g
              </h2>
              <small className="text-muted">per page</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-2">Carbon Score</h6>
              <h2 className="text-success mb-0">
                {crawl.reportJson?.summary?.averageCarbonScore || 0}
              </h2>
              <small className="text-muted">average</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-2">Pages Scanned</h6>
              <h2 className="text-warning mb-0">
                {crawl.pagesScanned}/{crawl.totalPages}
              </h2>
              <small className="text-muted">
                {Math.round((crawl.pagesScanned / crawl.totalPages) * 100)}% coverage
              </small>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="glass-card mb-4">
          <h5 className="mb-3">Page Status Breakdown</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-check-circle text-success fs-3 mb-2" />
                <h4 className="text-success">{statusCounts.completed}</h4>
                <small className="text-muted">Completed</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-x-circle text-danger fs-3 mb-2" />
                <h4 className="text-danger">{statusCounts.failed}</h4>
                <small className="text-muted">Failed</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-clock text-warning fs-3 mb-2" />
                <h4 className="text-warning">{statusCounts.pending}</h4>
                <small className="text-muted">Pending</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-arrow-repeat text-primary fs-3 mb-2" />
                <h4 className="text-primary">{statusCounts.running}</h4>
                <small className="text-muted">Running</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card mb-4">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <span className="text-muted me-2">Filter by status:</span>
            <button 
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All ({crawl.pages?.length || 0})
            </button>
            <button 
              className={`btn btn-sm ${filter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({statusCounts.completed})
            </button>
            <button 
              className={`btn btn-sm ${filter === 'failed' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilter('failed')}
            >
              Failed ({statusCounts.failed})
            </button>
            {statusCounts.pending > 0 && (
              <button 
                className={`btn btn-sm ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFilter('pending')}
              >
                Pending ({statusCounts.pending})
              </button>
            )}
            {statusCounts.running > 0 && (
              <button 
                className={`btn btn-sm ${filter === 'running' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('running')}
              >
                Running ({statusCounts.running})
              </button>
            )}
          </div>
        </div>

        {/* Retry Error */}
        {retryError && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {retryError}
            <button className="btn-close ms-auto" onClick={() => setRetryError('')} />
          </div>
        )}

        {/* Pages Table */}
        <div className="glass-card">
          <h5 className="mb-3">
            <i className="bi bi-list-ul text-primary me-2" />
            All Pages ({filteredPages.length})
          </h5>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>URL</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th>CO₂</th>
                  <th>Size</th>
                  <th>Scanned At</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <i className="bi bi-inbox display-4 text-muted mb-2" />
                      <p className="text-muted mb-0">No pages match this filter</p>
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page: any, i: number) => (
                    <>
                      <tr key={page.id}>
                        <td style={{ maxWidth: 0 }}>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            title={page.url}
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'var(--primary)',
                            }}
                          >
                            {page.url}
                          </a>
                        </td>
                        <td>
                          <span className={`badge ${
                            page.status === 'completed' ? 'bg-success' : 
                            page.status === 'failed' ? 'bg-danger' : 
                            page.status === 'pending' ? 'bg-warning' : 
                            'bg-secondary'
                          }`}>
                            {page.status}
                          </span>
                        </td>
                        <td>
                          {page.reportJson?.grade ? (
                            <GradeBadge grade={page.reportJson.grade} size={35} />
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          {page.reportJson?.co2Grams 
                            ? `${page.reportJson.co2Grams.toFixed(2)}g`
                            : <span className="text-muted">N/A</span>
                          }
                        </td>
                        <td>
                          {page.reportJson?.pageSizeMb 
                            ? `${page.reportJson.pageSizeMb} MB`
                            : <span className="text-muted">N/A</span>
                          }
                        </td>
                        <td>
                          <small>{new Date(page.createdAt).toLocaleString()}</small>
                        </td>
                        <td>
                          {page.status === 'completed' && page.reportJson ? (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => togglePage(i)}
                            >
                              <i className={`bi bi-chevron-${expandedPage === i ? 'up' : 'down'}`} />
                            </button>
                          ) : page.status === 'failed' ? (
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-danger" title={page.errorMessage}>
                                <i className="bi bi-exclamation-circle" />
                              </span>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                disabled={retryingPageId === page.id}
                                onClick={() => handleRetryPage(page.id)}
                              >
                                {retryingPageId === page.id
                                  ? <i className="bi bi-arrow-repeat spin" />
                                  : <><i className="bi bi-arrow-clockwise me-1" />Retry</>
                                }
                              </button>
                            </div>
                          ) : (page.status === 'running' || page.status === 'pending') ? (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              disabled={actionLoading}
                              onClick={handlePauseCrawl}
                              title="Pause entire crawl"
                            >
                              <i className="bi bi-pause-fill me-1" />Pause
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded Row with Page Details */}
                      {expandedPage === i && page.reportJson && (
                        <tr key={`${page.id}-details`}>
                          <td colSpan={7} style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                            <div className="p-4">
                              {/* Quick Stats */}
                              <div className="row g-3 mb-4">
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <h6 className="text-muted mb-2">Carbon Score</h6>
                                    <h4 className="text-primary">{page.reportJson.carbonScore}</h4>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <h6 className="text-muted mb-2">Load Time</h6>
                                    <h4 className="text-warning">
                                      {page.reportJson.summary?.loadTimeSec || 'N/A'}s
                                    </h4>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <h6 className="text-muted mb-2">Performance</h6>
                                    <h4 className="text-success">
                                      {page.reportJson.summary?.performanceScore || 'N/A'}
                                    </h4>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <h6 className="text-muted mb-2">Scan Duration</h6>
                                    <h4 className="text-secondary">
                                      {((new Date(page.updatedAt).getTime() - new Date(page.createdAt).getTime()) / 1000).toFixed(1)}s
                                    </h4>
                                  </div>
                                </div>
                              </div>

                              {/* Real World Equivalents */}
                              {page.reportJson.summary?.equivalents && (
                                <div className="mb-4">
                                  <h6 className="mb-3">
                                    <i className="bi bi-globe2 text-primary me-2" />
                                    Real World Impact
                                  </h6>
                                  <div className="row g-2">
                                    <div className="col-md-3">
                                      <div className="stat-card text-center">
                                        <i className="bi bi-phone text-primary mb-1" />
                                        <div>{page.reportJson.summary.equivalents.phoneCharges}</div>
                                        <small className="text-muted">Phone charges</small>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="stat-card text-center">
                                        <i className="bi bi-car-front text-warning mb-1" />
                                        <div>{page.reportJson.summary.equivalents.carDistanceKm} km</div>
                                        <small className="text-muted">Car distance</small>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="stat-card text-center">
                                        <i className="bi bi-lightbulb text-success mb-1" />
                                        <div>{page.reportJson.summary.equivalents.lightBulbHours} hrs</div>
                                        <small className="text-muted">LED bulb</small>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="stat-card text-center">
                                        <i className="bi bi-tree text-success mb-1" />
                                        <div>{page.reportJson.summary.equivalents.treesNeeded}</div>
                                        <small className="text-muted">Trees/year</small>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Resource Breakdown */}
                              {page.reportJson.breakdown?.byType && (
                                <div className="mb-4">
                                  <h6 className="mb-3">
                                    <i className="bi bi-pie-chart text-primary me-2" />
                                    Resource Breakdown (Top 5)
                                  </h6>
                                  <div className="table-responsive">
                                    <table className="table table-sm table-custom mb-0">
                                      <thead>
                                        <tr>
                                          <th>Type</th>
                                          <th>Size</th>
                                          <th>Requests</th>
                                          <th>CO₂</th>
                                          <th>%</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {page.reportJson.breakdown.byType.slice(0, 5).map((item: any, idx: number) => (
                                          <tr key={idx}>
                                            <td className="text-capitalize">{item.type}</td>
                                            <td>{item.sizeMb?.toFixed(2)} MB</td>
                                            <td>{item.requests}</td>
                                            <td>{item.co2Grams?.toFixed(4)}g</td>
                                            <td>{item.percent}%</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Unused Code Summary */}
                              {page.reportJson.breakdown?.unusedCode && (
                                <div className="mb-4">
                                  <h6 className="mb-3">
                                    <i className="bi bi-trash text-danger me-2" />
                                    Unused Code
                                  </h6>
                                  <div className="row g-3">
                                    <div className="col-md-6">
                                      <div className="stat-card">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <span><i className="bi bi-filetype-js text-warning me-2" />JavaScript</span>
                                          <span className="badge bg-danger">
                                            {page.reportJson.breakdown.unusedCode.js.unusedPercent}% unused
                                          </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                          <small className="text-muted">Wasted</small>
                                          <span className="text-danger">
                                            {page.reportJson.breakdown.unusedCode.js.unusedKb} KB
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <div className="stat-card">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <span><i className="bi bi-filetype-css text-secondary me-2" />CSS</span>
                                          <span className="badge bg-warning">
                                            {page.reportJson.breakdown.unusedCode.css.unusedPercent}% unused
                                          </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                          <small className="text-muted">Wasted</small>
                                          <span className="text-warning">
                                            {page.reportJson.breakdown.unusedCode.css.unusedKb} KB
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Quick Wins */}
                              {page.reportJson.quickWins?.length > 0 && (
                                <div className="mb-4">
                                  <h6 className="mb-3">
                                    <i className="bi bi-lightbulb text-warning me-2" />
                                    Quick Wins
                                  </h6>
                                  {page.reportJson.quickWins.slice(0, 3).map((win: any, idx: number) => (
                                    <div key={idx} className="stat-card mb-2">
                                      <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                          <strong>{win.action}</strong>
                                          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                            {win.howTo}
                                          </p>
                                        </div>
                                        <span className="badge bg-success">
                                          {win.co2SavedGrams?.toFixed(2)}g saved
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default CrawlDetails
