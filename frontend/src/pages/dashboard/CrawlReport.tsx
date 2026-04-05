import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import GradeBadge from '../../components/GradeBadge'
import ScoreCircle from '../../components/ScoreCircle'

interface CrawlReport {
  site: string
  totalPagesDiscovered: number
  pagesScanned: number
  summary: {
    pagesScanned: number
    averageCo2: number
    averageCarbonScore: number
    averagePageSizeMb: number
    grade: string
    worstPages: Array<{
      url: string
      co2Grams: number
      pageSizeMb: number
      grade: string
    }>
  }
  pages: Array<any>
  meta: {
    tier: string
    scannedAt: string
  }
}

const CrawlReport = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { report } = location.state as { report: CrawlReport } || {}
  const [expandedPage, setExpandedPage] = useState<number | null>(null)

  if (!report || !report.summary) {
    return (
      <div className="container py-5 text-center">
        <h3>No crawl report found</h3>
        <button className="glow-btn mt-3" onClick={() => navigate('/scan')}>Start New Scan</button>
      </div>
    )
  }

  const { site, totalPagesDiscovered, pagesScanned, summary, pages, meta } = report

  const togglePage = (index: number) => {
    setExpandedPage(expandedPage === index ? null : index)
  }

  return (
    <div className="fade-in">
      <div className="container-fluid">
        
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="mb-3">Full Site Crawl Report</h1>
          <p className="lead text-muted">{site}</p>
          <small className="text-muted">
            Scanned {new Date(meta.scannedAt).toLocaleString()} • {pagesScanned} of {totalPagesDiscovered} pages
          </small>
        </div>

        {/* Summary Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-3">Overall Grade</h6>
              <GradeBadge grade={summary.grade} size={100} />
            </div>
          </div>
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-3">Average CO₂</h6>
              <h1 className="text-primary mb-2">{summary.averageCo2.toFixed(2)}g</h1>
              <p className="text-muted mb-0">per page</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-3">Carbon Score</h6>
              <h1 className="text-success mb-2">{summary.averageCarbonScore}</h1>
              <p className="text-muted mb-0">average</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="glass-card text-center">
              <h6 className="text-muted mb-3">Avg Page Size</h6>
              <h1 className="text-warning mb-2">{summary.averagePageSizeMb} MB</h1>
              <p className="text-muted mb-0">per page</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="stat-card text-center">
              <div className="stat-icon mx-auto" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)' }}>
                <i className="bi bi-file-earmark-text" />
              </div>
              <h3 className="mt-3">{pagesScanned}</h3>
              <p className="text-muted mb-0">Pages Scanned</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card text-center">
              <div className="stat-icon mx-auto" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--secondary)' }}>
                <i className="bi bi-globe" />
              </div>
              <h3 className="mt-3">{totalPagesDiscovered}</h3>
              <p className="text-muted mb-0">Pages Discovered</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card text-center">
              <div className="stat-icon mx-auto" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                <i className="bi bi-percent" />
              </div>
              <h3 className="mt-3">{Math.round((pagesScanned / totalPagesDiscovered) * 100)}%</h3>
              <p className="text-muted mb-0">Coverage</p>
            </div>
          </div>
        </div>

        {/* Worst Performing Pages */}
        {summary.worstPages?.length > 0 && (
          <div className="glass-card mb-5">
            <h3 className="mb-4">
              <i className="bi bi-exclamation-triangle text-danger me-2" />
              Highest Carbon Footprint Pages
            </h3>
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>URL</th>
                    <th>Grade</th>
                    <th>CO₂</th>
                    <th>Page Size</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.worstPages.map((page, i) => (
                    <tr key={i}>
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
                        <GradeBadge grade={page.grade} size={40} />
                      </td>
                      <td className="text-danger fw-bold">{page.co2Grams.toFixed(2)}g</td>
                      <td>{page.pageSizeMb} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Pages with Expandable Details */}
        <div className="glass-card mb-5">
          <h3 className="mb-4">
            <i className="bi bi-list-ul text-primary me-2" />
            All Scanned Pages ({pages.length})
          </h3>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>URL</th>
                  <th>Grade</th>
                  <th>CO₂</th>
                  <th>Size</th>
                  <th>Score</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page, i) => (
                  <>
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => togglePage(i)}>
                      <td style={{ maxWidth: 0 }}>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noreferrer"
                          title={page.url}
                          onClick={(e) => e.stopPropagation()}
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
                        <GradeBadge grade={page.grade} size={35} />
                      </td>
                      <td>{page.co2Grams?.toFixed(2) ?? 'N/A'}g</td>
                      <td>{page.pageSizeMb ?? 'N/A'} MB</td>
                      <td>
                        <span className="badge bg-primary">{page.carbonScore ?? 'N/A'}</span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => togglePage(i)}>
                          <i className={`bi bi-chevron-${expandedPage === i ? 'up' : 'down'}`} />
                        </button>
                      </td>
                    </tr>
                    {expandedPage === i && page.summary && (
                      <tr key={`${i}-details`}>
                        <td colSpan={6} style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                          <div className="p-4">
                            {/* Individual Page Report */}
                            <div className="row g-3 mb-4">
                              <div className="col-md-3">
                                <div className="stat-card text-center">
                                  <h6 className="text-muted mb-2">Grade</h6>
                                  <GradeBadge grade={page.summary.grade} size={60} />
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="stat-card text-center">
                                  <h6 className="text-muted mb-2">Carbon Score</h6>
                                  <ScoreCircle score={page.summary.carbonScore} label="" />
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="stat-card text-center">
                                  <h6 className="text-muted mb-2">Load Time</h6>
                                  <h4 className="text-primary">{page.summary.loadTimeSec}s</h4>
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="stat-card text-center">
                                  <h6 className="text-muted mb-2">Performance</h6>
                                  <h4 className="text-success">{page.summary.performanceScore}</h4>
                                </div>
                              </div>
                            </div>

                            {/* Real World Equivalents */}
                            {page.summary.equivalents && (
                              <div className="row g-3 mb-4">
                                <div className="col-12">
                                  <h6 className="mb-3"><i className="bi bi-globe2 text-primary me-2" />Real World Impact</h6>
                                </div>
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <i className="bi bi-phone fs-4 text-primary mb-2" />
                                    <h5>{page.summary.equivalents.phoneCharges}</h5>
                                    <small className="text-muted">Phone charges</small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <i className="bi bi-car-front fs-4 text-warning mb-2" />
                                    <h5>{page.summary.equivalents.carDistanceKm} km</h5>
                                    <small className="text-muted">Car distance</small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <i className="bi bi-lightbulb fs-4 text-success mb-2" />
                                    <h5>{page.summary.equivalents.lightBulbHours} hrs</h5>
                                    <small className="text-muted">LED bulb</small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="stat-card text-center">
                                    <i className="bi bi-tree fs-4 text-success mb-2" />
                                    <h5>{page.summary.equivalents.treesNeeded}</h5>
                                    <small className="text-muted">Trees/year</small>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Locations */}
                            {page.locations && (
                              <div className="row g-3 mb-4">
                                <div className="col-12">
                                  <h6 className="mb-3"><i className="bi bi-geo-alt text-secondary me-2" />Carbon by Location</h6>
                                </div>
                                <div className="col-md-6">
                                  <div className="stat-card">
                                    <h6 className="text-muted mb-2"><i className="bi bi-server me-2" />Server</h6>
                                    <div className="d-flex justify-content-between mb-1">
                                      <small className="text-muted">Country</small>
                                      <span>{page.locations.server.country}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                      <small className="text-muted">CO₂</small>
                                      <span className="text-danger">{page.locations.server.co2Grams}g</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="stat-card">
                                    <h6 className="text-muted mb-2"><i className="bi bi-person me-2" />User</h6>
                                    <div className="d-flex justify-content-between mb-1">
                                      <small className="text-muted">Country</small>
                                      <span>{page.locations.user.country}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                      <small className="text-muted">CO₂</small>
                                      <span className="text-danger">{page.locations.user.co2Grams}g</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Resource Breakdown */}
                            {page.breakdown?.byType && (
                              <div className="mb-4">
                                <h6 className="mb-3"><i className="bi bi-pie-chart text-primary me-2" />Resource Breakdown</h6>
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
                                      {page.breakdown.byType.slice(0, 5).map((item: any, idx: number) => (
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

                            {/* Largest Files */}
                            {page.breakdown?.largestFiles?.length > 0 && (
                              <div className="mb-4">
                                <h6 className="mb-3"><i className="bi bi-file-earmark-bar-graph text-warning me-2" />Largest Files</h6>
                                <div className="table-responsive">
                                  <table className="table table-sm table-custom mb-0">
                                    <thead>
                                      <tr>
                                        <th>File</th>
                                        <th>Type</th>
                                        <th>Size</th>
                                        <th>CO₂</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {page.breakdown.largestFiles.slice(0, 5).map((file: any, idx: number) => (
                                        <tr key={idx}>
                                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <a href={file.url} target="_blank" rel="noreferrer" title={file.url} style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
                                              {file.url.split('/').pop() || file.url}
                                            </a>
                                          </td>
                                          <td><span className="badge bg-secondary text-capitalize" style={{ fontSize: '0.7rem' }}>{file.type}</span></td>
                                          <td>{file.sizeKb} KB</td>
                                          <td>{file.co2Grams?.toFixed(4)}g</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Third Party */}
                            {page.breakdown?.thirdParty && page.breakdown.thirdParty.count > 0 && (
                              <div className="mb-4">
                                <h6 className="mb-3"><i className="bi bi-box-arrow-up-right text-secondary me-2" />Third-Party Resources</h6>
                                <div className="row g-2">
                                  <div className="col-md-3">
                                    <div className="stat-card text-center">
                                      <h5 className="text-primary">{page.breakdown.thirdParty.count}</h5>
                                      <small className="text-muted">Resources</small>
                                    </div>
                                  </div>
                                  <div className="col-md-3">
                                    <div className="stat-card text-center">
                                      <h5 className="text-warning">{page.breakdown.thirdParty.totalSizeKb} KB</h5>
                                      <small className="text-muted">Total Size</small>
                                    </div>
                                  </div>
                                  <div className="col-md-3">
                                    <div className="stat-card text-center">
                                      <h5 className="text-danger">{page.breakdown.thirdParty.co2Grams}g</h5>
                                      <small className="text-muted">CO₂</small>
                                    </div>
                                  </div>
                                  <div className="col-md-3">
                                    <div className="stat-card text-center">
                                      <h5 className="text-secondary">{page.breakdown.thirdParty.percentOfTotal}%</h5>
                                      <small className="text-muted">of page</small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Quick Wins */}
                            {page.quickWins?.length > 0 && (
                              <div className="mb-4">
                                <h6 className="mb-3"><i className="bi bi-lightbulb text-warning me-2" />Quick Wins</h6>
                                {page.quickWins.map((win: any, idx: number) => (
                                  <div key={idx} className="stat-card mb-2">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div>
                                        <strong>{win.action}</strong>
                                        <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{win.howTo}</p>
                                        {win.details && <small className="text-muted">{win.details}</small>}
                                      </div>
                                      <span className="badge bg-success">{win.co2SavedGrams?.toFixed(2)}g saved</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Unused Code with Files */}
                            {page.breakdown?.unusedCode && (
                              <div className="mb-4">
                                <h6 className="mb-3"><i className="bi bi-trash text-danger me-2" />Unused Code</h6>
                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <div className="stat-card">
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0"><i className="bi bi-filetype-js text-warning me-2" />JavaScript</h6>
                                        <span className="badge bg-danger">{page.breakdown.unusedCode.js.unusedPercent}% unused</span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-1">
                                        <small className="text-muted">Total</small>
                                        <span>{page.breakdown.unusedCode.js.totalKb} KB</span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-2">
                                        <small className="text-muted">Wasted</small>
                                        <span className="text-danger">{page.breakdown.unusedCode.js.unusedKb} KB</span>
                                      </div>
                                      <div className="progress mb-2" style={{ height: '6px' }}>
                                        <div className="progress-bar bg-danger" style={{ width: `${page.breakdown.unusedCode.js.unusedPercent}%` }} />
                                      </div>
                                      {page.breakdown.unusedCode.js.files?.length > 0 && (
                                        <div className="mt-2">
                                          <small className="text-muted d-block mb-1">Affected Files ({page.breakdown.unusedCode.js.files.length})</small>
                                          {page.breakdown.unusedCode.js.files.slice(0, 3).map((f: any, idx: number) => (
                                            <div key={idx} className="d-flex justify-content-between py-1" style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.75rem' }}>
                                              <a href={f.url} target="_blank" rel="noreferrer" title={f.url} style={{ color: 'var(--primary)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {f.url.split('/').pop() || f.url}
                                              </a>
                                              <span className="text-danger">{Math.round(f.wastedBytes / 1024)} KB ({f.wastedPercent}%)</span>
                                            </div>
                                          ))}
                                          {page.breakdown.unusedCode.js.files.length > 3 && (
                                            <small className="text-muted">+ {page.breakdown.unusedCode.js.files.length - 3} more files</small>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="stat-card">
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0"><i className="bi bi-filetype-css text-secondary me-2" />CSS</h6>
                                        <span className="badge bg-warning">{page.breakdown.unusedCode.css.unusedPercent}% unused</span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-1">
                                        <small className="text-muted">Total</small>
                                        <span>{page.breakdown.unusedCode.css.totalKb} KB</span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-2">
                                        <small className="text-muted">Wasted</small>
                                        <span className="text-warning">{page.breakdown.unusedCode.css.unusedKb} KB</span>
                                      </div>
                                      <div className="progress mb-2" style={{ height: '6px' }}>
                                        <div className="progress-bar bg-warning" style={{ width: `${page.breakdown.unusedCode.css.unusedPercent}%` }} />
                                      </div>
                                      {page.breakdown.unusedCode.css.files?.length > 0 && (
                                        <div className="mt-2">
                                          <small className="text-muted d-block mb-1">Affected Files ({page.breakdown.unusedCode.css.files.length})</small>
                                          {page.breakdown.unusedCode.css.files.slice(0, 3).map((f: any, idx: number) => (
                                            <div key={idx} className="d-flex justify-content-between py-1" style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.75rem' }}>
                                              <a href={f.url} target="_blank" rel="noreferrer" title={f.url} style={{ color: 'var(--primary)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {f.url.split('/').pop() || f.url}
                                              </a>
                                              <span className="text-warning">{Math.round(f.wastedBytes / 1024)} KB ({f.wastedPercent}%)</span>
                                            </div>
                                          ))}
                                          {page.breakdown.unusedCode.css.files.length > 3 && (
                                            <small className="text-muted">+ {page.breakdown.unusedCode.css.files.length - 3} more files</small>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Projections */}
                            {page.projections && (
                              <div className="mb-4">
                                <h6 className="mb-3"><i className="bi bi-arrow-up-circle text-success me-2" />Optimization Potential</h6>
                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <div className="stat-card">
                                      <h6 className="text-muted mb-2">Current</h6>
                                      <div className="d-flex justify-content-between mb-1">
                                        <small className="text-muted">Page Size</small>
                                        <span>{page.projections.current.pageSizeMb} MB</span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-1">
                                        <small className="text-muted">CO₂</small>
                                        <span>{page.projections.current.co2Grams?.toFixed(2)}g</span>
                                      </div>
                                      <div className="d-flex justify-content-between">
                                        <small className="text-muted">Load Time</small>
                                        <span>{page.projections.current.loadTimeSec}s</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="stat-card" style={{ borderColor: 'var(--success)' }}>
                                      <h6 className="text-success mb-2">If Optimized</h6>
                                      <div className="d-flex justify-content-between mb-1">
                                        <small className="text-muted">Page Size</small>
                                        <span className="text-success">{page.projections.ifOptimized.pageSizeMb} MB</span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-1">
                                        <small className="text-muted">CO₂</small>
                                        <span className="text-success">{page.projections.ifOptimized.co2Grams?.toFixed(2)}g</span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-2">
                                        <small className="text-muted">Load Time</small>
                                        <span className="text-success">{page.projections.ifOptimized.loadTimeSec}s</span>
                                      </div>
                                      <span className="badge bg-success">{page.projections.ifOptimized.improvement}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center glass-card">
          <h4 className="mb-3">Need More Details?</h4>
          <p className="text-muted mb-4">
            View individual page reports or export the full crawl data
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <button className="btn btn-outline-primary" onClick={() => navigate('/scan')}>
              <i className="bi bi-arrow-repeat me-2" />
              New Scan
            </button>
            <button className="btn btn-outline-secondary" onClick={() => navigate('/history')}>
              <i className="bi bi-clock-history me-2" />
              View History
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default CrawlReport
