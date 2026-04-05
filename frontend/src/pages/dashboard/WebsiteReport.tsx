import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'
import GradeBadge from '../../components/GradeBadge'
import ScoreCircle from '../../components/ScoreCircle'

const WebsiteReport = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scan, setScan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      const data = await apiService.getScanHistoryById(user?.type ?? 'free', id!)
      setScan(data)
    } catch (error) {
      console.error('Failed to load report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!scan) return <div className="text-center py-5">Report not found</div>

  const r = scan.reportJson
  const summary = r?.summary
  const breakdown = r?.breakdown
  const locations = r?.locations
  const projections = r?.projections
  const quickWins = r?.quickWins || []
  const meta = r?.meta
  const badge = r?.badge

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-outline-secondary mb-2" onClick={() => navigate('/history')}>
            <i className="bi bi-arrow-left me-2" />
            Back to History
          </button>
          <h2 className="mb-1">Scan Report</h2>
          {meta?.scannedAt && (
            <small className="text-muted">
              Scanned on {new Date(meta.scannedAt).toLocaleString()}
              {meta.scanDurationSeconds && ` · ${meta.scanDurationSeconds}s scan`}
            </small>
          )}
        </div>
        <button className="glow-btn" onClick={() => navigate('/export')}>
          <i className="bi bi-download me-2" />
          Export
        </button>
      </div>

      {/* Top Summary */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-3">Carbon Grade</h6>
            <GradeBadge grade={badge?.grade || scan.grade || 'N/A'} size={90} />
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-3">Carbon Score</h6>
            <ScoreCircle score={summary?.carbonScore ?? scan.carbonScore ?? 0} />
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-3">CO₂ Emissions</h6>
            <h2 className="text-primary mb-0">{(summary?.co2Grams ?? scan.co2Grams ?? 0).toFixed(4)}g</h2>
            <small className="text-muted">per visit</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-3">Page Size</h6>
            <h2 className="text-warning mb-0">{summary?.pageSizeMb ?? scan.pageSizeMb ?? 0} MB</h2>
            <small className="text-muted">total transfer</small>
          </div>
        </div>
      </div>

      {/* Performance + Comparison */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-2">Performance Score</h6>
            <h3 className="text-success mb-0">{summary?.performanceScore ?? 'N/A'}</h3>
            <small className="text-muted">/ 100</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-2">Load Time</h6>
            <h3 className="text-warning mb-0">{summary?.loadTimeSec ?? 'N/A'}s</h3>
            <small className="text-muted">largest contentful paint</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-2">vs Industry Average</h6>
            <h3 className={`mb-0 ${summary?.comparison?.status?.includes('better') ? 'text-success' : 'text-danger'}`}>
              {summary?.comparison?.status ?? 'N/A'}
            </h3>
            <small className="text-muted">industry avg: {summary?.comparison?.industryAverage ?? 1.6}g</small>
          </div>
        </div>
      </div>

      {/* Real World Equivalents */}
      {summary?.equivalents && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-globe2 text-primary me-2" />
            Real World Impact (per visit)
          </h5>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-phone text-primary fs-3 mb-2" />
                <h4>{summary.equivalents.phoneCharges}</h4>
                <small className="text-muted">Phone charges</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-car-front text-warning fs-3 mb-2" />
                <h4>{summary.equivalents.carDistanceKm} km</h4>
                <small className="text-muted">Car distance</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-lightbulb text-success fs-3 mb-2" />
                <h4>{summary.equivalents.lightBulbHours} hrs</h4>
                <small className="text-muted">LED bulb</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-card text-center">
                <i className="bi bi-tree text-success fs-3 mb-2" />
                <h4>{summary.equivalents.treesNeeded}</h4>
                <small className="text-muted">Trees/year</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Analysis */}
      {locations && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-geo-alt text-primary me-2" />
            Location Analysis
          </h5>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="stat-card">
                <h6 className="text-primary mb-3"><i className="bi bi-server me-2" />Server</h6>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Country</small>
                  <span>{locations.server.country} ({locations.server.countryCode})</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Carbon Intensity</small>
                  <span>{locations.server.carbonIntensity} g/kWh</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Energy</small>
                  <span>{locations.server.energyKwh} kWh</span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">CO₂</small>
                  <span className="fw-bold">{locations.server.co2Grams.toFixed(4)}g</span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="stat-card">
                <h6 className="text-secondary mb-3"><i className="bi bi-person me-2" />User</h6>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Country</small>
                  <span>{locations.user.country} ({locations.user.countryCode})</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Carbon Intensity</small>
                  <span>{locations.user.carbonIntensity} g/kWh</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Energy</small>
                  <span>{locations.user.energyKwh} kWh</span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">CO₂</small>
                  <span className="fw-bold">{locations.user.co2Grams.toFixed(4)}g</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Breakdown */}
      {breakdown?.byType && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-pie-chart text-primary me-2" />
            Resource Breakdown
          </h5>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Requests</th>
                  <th>CO₂</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.byType.map((item: any) => (
                  <tr key={item.type}>
                    <td className="text-capitalize">{item.type}</td>
                    <td>{item.sizeMb?.toFixed(2)} MB</td>
                    <td>{item.requests}</td>
                    <td>{item.co2Grams?.toFixed(4)}g</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                          <div className="progress-bar bg-primary" style={{ width: `${item.percent}%` }} />
                        </div>
                        <small>{item.percent}%</small>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Offenders */}
      {breakdown?.topOffenders?.length > 0 && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-exclamation-triangle text-warning me-2" />
            Top Offenders (Largest Files)
          </h5>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>CO₂</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.topOffenders.map((file: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <a href={file.url} target="_blank" rel="noreferrer"
                        className="text-truncate d-inline-block text-primary"
                        style={{ maxWidth: '300px' }} title={file.url}>
                        {file.file}
                      </a>
                    </td>
                    <td className="text-capitalize">{file.type}</td>
                    <td>{file.sizeMb?.toFixed(2)} MB ({file.sizeKb} KB)</td>
                    <td>{file.co2Grams?.toFixed(4)}g</td>
                    <td>{file.percentOfTotal}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unused Code */}
      {breakdown?.unusedCode && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-trash text-danger me-2" />
            Unused Code
          </h5>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span><i className="bi bi-filetype-js text-warning me-2" />JavaScript</span>
                  <span className="badge bg-danger">{breakdown.unusedCode.js.unusedPercent}% unused</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Total</small>
                  <span>{breakdown.unusedCode.js.totalKb} KB</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Wasted</small>
                  <span className="text-danger">{breakdown.unusedCode.js.unusedKb} KB</span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">CO₂ wasted</small>
                  <span className="text-danger">{breakdown.unusedCode.js.co2WastedGrams?.toFixed(4)}g</span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span><i className="bi bi-filetype-css text-info me-2" />CSS</span>
                  <span className="badge bg-warning text-dark">{breakdown.unusedCode.css.unusedPercent}% unused</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Total</small>
                  <span>{breakdown.unusedCode.css.totalKb} KB</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Wasted</small>
                  <span className="text-warning">{breakdown.unusedCode.css.unusedKb} KB</span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">CO₂ wasted</small>
                  <span className="text-warning">{breakdown.unusedCode.css.co2WastedGrams?.toFixed(4)}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unused JS Files */}
          {breakdown.unusedCode.js.files?.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2"><i className="bi bi-filetype-js text-warning me-2" />Unused JavaScript Files</h6>
              <div className="table-responsive">
                <table className="table table-sm table-custom mb-0">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Total</th>
                      <th>Wasted</th>
                      <th>Wasted %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.unusedCode.js.files.map((file: any, i: number) => (
                      <tr key={i}>
                        <td>
                          <a href={file.url} target="_blank" rel="noreferrer"
                            className="text-truncate d-inline-block text-primary"
                            style={{ maxWidth: '350px' }} title={file.url}>
                            {file.url.split('/').pop() || file.url}
                          </a>
                        </td>
                        <td>{Math.round(file.totalBytes / 1024)} KB</td>
                        <td className="text-danger">{Math.round(file.wastedBytes / 1024)} KB</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '6px' }}>
                              <div className="progress-bar bg-danger" style={{ width: `${file.wastedPercent}%` }} />
                            </div>
                            <small className="text-danger">{file.wastedPercent}%</small>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unused CSS Files */}
          {breakdown.unusedCode.css.files?.length > 0 && (
            <div>
              <h6 className="mb-2"><i className="bi bi-filetype-css text-info me-2" />Unused CSS Files</h6>
              <div className="table-responsive">
                <table className="table table-sm table-custom mb-0">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Total</th>
                      <th>Wasted</th>
                      <th>Wasted %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.unusedCode.css.files.map((file: any, i: number) => (
                      <tr key={i}>
                        <td>
                          <a href={file.url} target="_blank" rel="noreferrer"
                            className="text-truncate d-inline-block text-primary"
                            style={{ maxWidth: '350px' }} title={file.url}>
                            {file.url.split('/').pop() || file.url}
                          </a>
                        </td>
                        <td>{Math.round(file.totalBytes / 1024)} KB</td>
                        <td className="text-warning">{Math.round(file.wastedBytes / 1024)} KB</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '6px' }}>
                              <div className="progress-bar bg-warning" style={{ width: `${file.wastedPercent}%` }} />
                            </div>
                            <small className="text-warning">{file.wastedPercent}%</small>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-lightbulb text-warning me-2" />
            Optimization Recommendations
          </h5>
          {quickWins.map((win: any, i: number) => (
            <div key={i} className="stat-card mb-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="mb-1">{win.action}</h6>
                  <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{win.howTo}</p>
                  {win.details && <small className="text-muted">{win.details}</small>}
                </div>
                <span className="badge bg-primary">{win.effort}</span>
              </div>
              <div className="d-flex gap-3 mt-2">
                <div>
                  <small className="text-muted">CO₂ Saved</small>
                  <div className="fw-bold text-success">{win.co2SavedGrams?.toFixed(4)}g</div>
                </div>
                <div>
                  <small className="text-muted">Improvement</small>
                  <div className="fw-bold text-primary">{win.percentImprovement}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projections */}
      {projections && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-graph-up text-success me-2" />
            Optimization Potential
          </h5>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="stat-card">
                <h6 className="text-muted mb-3">Current</h6>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Page Size</small>
                  <span>{projections.current.pageSizeMb} MB</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">CO₂</small>
                  <span>{projections.current.co2Grams?.toFixed(4)}g</span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Load Time</small>
                  <span>{projections.current.loadTimeSec}s</span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="stat-card" style={{ borderColor: 'var(--success)' }}>
                <h6 className="text-success mb-3">If Optimized</h6>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Page Size</small>
                  <span className="text-success">{projections.ifOptimized.pageSizeMb} MB</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">CO₂</small>
                  <span className="text-success">{projections.ifOptimized.co2Grams?.toFixed(4)}g</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <small className="text-muted">Load Time</small>
                  <span className="text-success">{projections.ifOptimized.loadTimeSec}s</span>
                </div>
                <span className="badge bg-success">{projections.ifOptimized.improvement}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Meta */}
      {meta && (
        <div className="glass-card">
          <h5 className="mb-3">
            <i className="bi bi-info-circle text-muted me-2" />
            Scan Info
          </h5>
          <div className="row g-3">
            <div className="col-md-3">
              <small className="text-muted d-block">Scanned At</small>
              <span>{new Date(meta.scannedAt).toLocaleString()}</span>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Scan Duration</small>
              <span>{meta.scanDurationSeconds}s</span>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Lighthouse Version</small>
              <span>{meta.lighthouseVersion}</span>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Cached</small>
              <span>{meta.cached ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebsiteReport
