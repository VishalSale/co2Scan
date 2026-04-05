import { useLocation, useNavigate } from 'react-router-dom'
import { ScanResult } from '../../types'
import GradeBadge from '../../components/GradeBadge'
import ScoreCircle from '../../components/ScoreCircle'

const ScanResultPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { result, url } = location.state as { result: ScanResult; url: string } || {}

  if (!result) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-exclamation-triangle display-1 text-muted mb-3" />
        <h3>No scan result found</h3>
        <button className="glow-btn mt-3" onClick={() => navigate('/scan')}>Go Back</button>
      </div>
    )
  }

  const { summary, breakdown, projections, quickWins, meta, locations } = result
  const isBetter = summary.comparison?.status?.toLowerCase().includes('better')

  return (
    <div className="fade-in">

      {/* ── Hero Header ── */}
      <div className="glass-card mb-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))', borderColor: 'rgba(16,185,129,0.3)' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => navigate('/scan')}>
              <i className="bi bi-arrow-left me-2" />New Scan
            </button>
            <h2 className="mb-1" style={{ fontSize: '1.75rem' }}>Scan Results</h2>
            {url && (
              <p className="mb-1" style={{ fontSize: '0.95rem' }}>
                <i className="bi bi-globe me-2 text-primary" />
                <a href={url} target="_blank" rel="noreferrer" className="text-primary">{url}</a>
              </p>
            )}
            {meta?.scannedAt && (
              <small className="text-muted">
                {new Date(meta.scannedAt).toLocaleString()}
                {meta.scanDurationSeconds && <span className="ms-2">· {meta.scanDurationSeconds}s scan</span>}
                {meta.scansRemainingToday >= 0 && (
                  <span className="ms-2 badge bg-secondary">{meta.scansRemainingToday} scans left today</span>
                )}
              </small>
            )}
          </div>
          <button className="glow-btn" style={{ padding: '10px 24px' }} onClick={() => navigate('/export')}>
            <i className="bi bi-download me-2" />Export
          </button>
        </div>
      </div>

      {/* ── Key Metrics Row ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="glass-card text-center h-100" style={{ padding: '1.5rem 1rem' }}>
            <small className="text-muted d-block mb-2">Carbon Grade</small>
            <GradeBadge grade={summary.grade} size={72} />
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="glass-card text-center h-100" style={{ padding: '1.5rem 1rem' }}>
            <small className="text-muted d-block mb-2">Carbon Score</small>
            <ScoreCircle score={summary.carbonScore} />
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="glass-card text-center h-100" style={{ padding: '1.5rem 1rem' }}>
            <small className="text-muted d-block mb-2">CO₂ per Visit</small>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
              {summary.co2Grams.toFixed(3)}
            </div>
            <small className="text-muted">grams CO₂</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="glass-card text-center h-100" style={{ padding: '1.5rem 1rem' }}>
            <small className="text-muted d-block mb-2">Page Size</small>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
              {summary.pageSizeMb}
            </div>
            <small className="text-muted">MB transfer</small>
          </div>
        </div>
      </div>

      {/* ── Performance Strip ── */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="glass-card text-center" style={{ padding: '1.25rem' }}>
            <small className="text-muted d-block mb-1">Performance</small>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
              {summary.performanceScore ?? 'N/A'}
              <small className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}> / 100</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card text-center" style={{ padding: '1.25rem' }}>
            <small className="text-muted d-block mb-1">Load Time</small>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)' }}>
              {summary.loadTimeSec ?? 'N/A'}
              <small className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}>s</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card text-center" style={{ padding: '1.25rem' }}>
            <small className="text-muted d-block mb-1">vs Industry Avg</small>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isBetter ? 'var(--success)' : 'var(--danger)' }}>
              {isBetter ? <i className="bi bi-arrow-down-circle me-1" /> : <i className="bi bi-arrow-up-circle me-1" />}
              {summary.comparison?.status ?? 'N/A'}
            </div>
            <small className="text-muted">avg: {summary.comparison?.industryAverage ?? 1.6}g</small>
          </div>
        </div>
      </div>

      {/* ── Real World Impact ── */}
      {summary.equivalents && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-globe2 text-primary me-2" />Real World Impact
            <small className="text-muted ms-2" style={{ fontSize: '0.8rem', fontWeight: 400 }}>per page visit</small>
          </h5>
          <div className="row g-3">
            {[
              { icon: 'bi-phone', color: 'var(--primary)', value: summary.equivalents.phoneCharges, label: 'Phone charges' },
              { icon: 'bi-car-front', color: 'var(--warning)', value: `${summary.equivalents.carDistanceKm} km`, label: 'Car distance' },
              { icon: 'bi-lightbulb', color: 'var(--success)', value: `${summary.equivalents.lightBulbHours} hrs`, label: 'LED bulb' },
              { icon: 'bi-tree', color: '#22c55e', value: summary.equivalents.treesNeeded, label: 'Trees/year' },
            ].map((item, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="stat-card text-center" style={{ padding: '1.25rem' }}>
                  <i className={`bi ${item.icon} fs-2 mb-2`} style={{ color: item.color }} />
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{item.value}</div>
                  <small className="text-muted">{item.label}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Resource Breakdown ── */}
      {breakdown?.byType && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-pie-chart text-primary me-2" />Resource Breakdown
          </h5>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Requests</th>
                  <th>CO₂</th>
                  <th style={{ minWidth: '160px' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.byType.map((item) => (
                  <tr key={item.type}>
                    <td className="text-capitalize fw-semibold">{item.type}</td>
                    <td>{item.sizeMb?.toFixed(2)} MB</td>
                    <td>{item.requests}</td>
                    <td>{item.co2Grams?.toFixed(4)}g</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                          <div className="progress-bar bg-primary" style={{ width: `${item.percent}%` }} />
                        </div>
                        <small style={{ minWidth: '36px' }}>{item.percent}%</small>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Unused Code ── */}
      {breakdown?.unusedCode && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-trash text-danger me-2" />Unused Code
          </h5>
          <div className="row g-3 mb-3">
            {[
              {
                lang: 'JavaScript', icon: 'bi-filetype-js', iconColor: 'text-warning',
                badgeClass: 'bg-danger', data: breakdown.unusedCode.js,
                wastedColor: 'text-danger', barColor: 'bg-danger',
              },
              {
                lang: 'CSS', icon: 'bi-filetype-css', iconColor: 'text-info',
                badgeClass: 'bg-warning text-dark', data: breakdown.unusedCode.css,
                wastedColor: 'text-warning', barColor: 'bg-warning',
              },
            ].map(({ lang, icon, iconColor, badgeClass, data, wastedColor, barColor }) => (
              <div key={lang} className="col-md-6">
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-semibold"><i className={`bi ${icon} ${iconColor} me-2`} />{lang}</span>
                    <span className={`badge ${badgeClass}`}>{data.unusedPercent}% unused</span>
                  </div>
                  <div className="progress mb-2" style={{ height: '8px' }}>
                    <div className={`progress-bar ${barColor}`} style={{ width: `${data.unusedPercent}%` }} />
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <small className="text-muted">Wasted: <span className={wastedColor}>{data.unusedKb} KB</span></small>
                    <small className="text-muted">CO₂: <span className={wastedColor}>{data.co2WastedGrams?.toFixed(4)}g</span></small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* JS files */}
          {breakdown.unusedCode.js.files?.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2"><i className="bi bi-filetype-js text-warning me-2" />Unused JS Files</h6>
              <div className="table-responsive">
                <table className="table table-sm table-custom mb-0">
                  <thead><tr><th>File</th><th>Total</th><th>Wasted</th><th>%</th></tr></thead>
                  <tbody>
                    {breakdown.unusedCode.js.files.map((f, i) => (
                      <tr key={i}>
                        <td>
                          <a href={f.url} target="_blank" rel="noreferrer"
                            className="text-truncate d-inline-block text-primary"
                            style={{ maxWidth: '320px' }} title={f.url}>
                            {f.url.split('/').pop() || f.url}
                          </a>
                        </td>
                        <td>{Math.round(f.totalBytes / 1024)} KB</td>
                        <td className="text-danger">{Math.round(f.wastedBytes / 1024)} KB</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '5px' }}>
                              <div className="progress-bar bg-danger" style={{ width: `${f.wastedPercent}%` }} />
                            </div>
                            <small className="text-danger">{f.wastedPercent}%</small>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CSS files */}
          {breakdown.unusedCode.css.files?.length > 0 && (
            <div>
              <h6 className="mb-2"><i className="bi bi-filetype-css text-info me-2" />Unused CSS Files</h6>
              <div className="table-responsive">
                <table className="table table-sm table-custom mb-0">
                  <thead><tr><th>File</th><th>Total</th><th>Wasted</th><th>%</th></tr></thead>
                  <tbody>
                    {breakdown.unusedCode.css.files.map((f, i) => (
                      <tr key={i}>
                        <td>
                          <a href={f.url} target="_blank" rel="noreferrer"
                            className="text-truncate d-inline-block text-primary"
                            style={{ maxWidth: '320px' }} title={f.url}>
                            {f.url.split('/').pop() || f.url}
                          </a>
                        </td>
                        <td>{Math.round(f.totalBytes / 1024)} KB</td>
                        <td className="text-warning">{Math.round(f.wastedBytes / 1024)} KB</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '5px' }}>
                              <div className="progress-bar bg-warning" style={{ width: `${f.wastedPercent}%` }} />
                            </div>
                            <small className="text-warning">{f.wastedPercent}%</small>
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

      {/* ── Largest Files ── */}
      {breakdown?.largestFiles?.length > 0 && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-exclamation-triangle text-warning me-2" />Largest Files
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
                {breakdown.largestFiles.map((file, i) => (
                  <tr key={i}>
                    <td>
                      <a href={file.url} target="_blank" rel="noreferrer"
                        className="text-truncate d-inline-block text-primary"
                        style={{ maxWidth: '280px' }} title={file.url}>
                        {file.file}
                      </a>
                    </td>
                    <td><span className="badge bg-secondary text-capitalize">{file.type}</span></td>
                    <td>{file.sizeMb?.toFixed(2)} MB</td>
                    <td>{file.co2Grams?.toFixed(4)}g</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                          <div className="progress-bar bg-warning" style={{ width: `${file.percentOfTotal}%` }} />
                        </div>
                        <small>{file.percentOfTotal}%</small>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Third Party ── */}
      {breakdown?.thirdParty && breakdown.thirdParty.count > 0 && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-box-arrow-up-right text-warning me-2" />Third Party Resources
          </h5>
          <div className="row g-3">
            {[
              { label: 'Requests', value: breakdown.thirdParty.count, color: 'var(--secondary)' },
              { label: 'Total Size', value: `${breakdown.thirdParty.totalSizeKb} KB`, color: 'var(--warning)' },
              { label: 'CO₂', value: `${breakdown.thirdParty.co2Grams?.toFixed(4)}g`, color: 'var(--danger)' },
              { label: '% of Total', value: `${breakdown.thirdParty.percentOfTotal}%`, color: 'var(--primary)' },
            ].map((item, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="stat-card text-center" style={{ padding: '1.25rem' }}>
                  <small className="text-muted d-block mb-1">{item.label}</small>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Location Analysis ── */}
      {locations && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-geo-alt text-primary me-2" />Location Analysis
          </h5>
          <div className="row g-3 mb-3">
            {[
              { label: 'Server', icon: 'bi-server', color: 'var(--primary)', data: locations.server },
              { label: 'User', icon: 'bi-person', color: 'var(--secondary)', data: locations.user },
            ].map(({ label, icon, color, data }) => (
              <div key={label} className="col-md-6">
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                  <h6 className="mb-3" style={{ color }}>
                    <i className={`bi ${icon} me-2`} />{label}
                  </h6>
                  {[
                    { k: 'Country', v: `${data.country} (${data.countryCode})` },
                    { k: 'Carbon Intensity', v: `${data.carbonIntensity} g/kWh` },
                    { k: 'Energy', v: `${data.energyKwh} kWh` },
                    { k: 'CO₂', v: `${data.co2Grams.toFixed(4)}g` },
                  ].map(({ k, v }) => (
                    <div key={k} className="d-flex justify-content-between mb-1">
                      <small className="text-muted">{k}</small>
                      <small className="fw-semibold">{v}</small>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {locations.combined && (
            <div className="row g-3">
              <div className="col-6">
                <div className="stat-card text-center" style={{ padding: '1rem', borderColor: 'rgba(16,185,129,0.3)' }}>
                  <small className="text-muted d-block">Combined CO₂</small>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {locations.combined.totalCo2Grams?.toFixed(4)}g
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-card text-center" style={{ padding: '1rem' }}>
                  <small className="text-muted d-block">Combined Energy</small>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>
                    {locations.combined.totalEnergyKwh} kWh
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Quick Wins ── */}
      {quickWins?.length > 0 && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-lightbulb text-warning me-2" />Optimization Recommendations
          </h5>
          <div className="row g-3">
            {quickWins.map((win, i) => (
              <div key={i} className="col-12">
                <div className="stat-card" style={{ padding: '1.25rem', borderLeft: '3px solid var(--primary)' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0">{win.action}</h6>
                    <div className="d-flex gap-2">
                      <span className="badge bg-primary">{win.effort}</span>
                      <span className="badge bg-success">{win.co2SavedGrams?.toFixed(3)}g saved</span>
                    </div>
                  </div>
                  <p className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>{win.howTo}</p>
                  {win.details && <small className="text-muted">{win.details}</small>}
                  <div className="mt-2">
                    <small className="text-muted">Improvement: </small>
                    <small className="text-primary fw-semibold">{win.percentImprovement}%</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Optimization Potential ── */}
      {projections && (
        <div className="glass-card mb-4">
          <h5 className="mb-3">
            <i className="bi bi-graph-up text-success me-2" />Optimization Potential
          </h5>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="stat-card" style={{ padding: '1.25rem' }}>
                <h6 className="text-muted mb-3">Current</h6>
                {[
                  { k: 'Page Size', v: `${projections.current.pageSizeMb} MB` },
                  { k: 'CO₂', v: `${projections.current.co2Grams?.toFixed(4)}g` },
                  { k: 'Load Time', v: `${projections.current.loadTimeSec}s` },
                ].map(({ k, v }) => (
                  <div key={k} className="d-flex justify-content-between mb-2">
                    <small className="text-muted">{k}</small>
                    <span className="fw-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-6">
              <div className="stat-card" style={{ padding: '1.25rem', borderColor: 'var(--success)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="text-success mb-0">If Optimized</h6>
                  <span className="badge bg-success">{projections.ifOptimized.improvement}</span>
                </div>
                {[
                  { k: 'Page Size', v: `${projections.ifOptimized.pageSizeMb} MB` },
                  { k: 'CO₂', v: `${projections.ifOptimized.co2Grams?.toFixed(4)}g` },
                  { k: 'Load Time', v: `${projections.ifOptimized.loadTimeSec}s` },
                ].map(({ k, v }) => (
                  <div key={k} className="d-flex justify-content-between mb-2">
                    <small className="text-muted">{k}</small>
                    <span className="fw-semibold text-success">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Scan Meta ── */}
      {meta && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="d-flex flex-wrap gap-4">
            <div>
              <small className="text-muted d-block">Scanned At</small>
              <small className="fw-semibold">{new Date(meta.scannedAt).toLocaleString()}</small>
            </div>
            <div>
              <small className="text-muted d-block">Duration</small>
              <small className="fw-semibold">{meta.scanDurationSeconds}s</small>
            </div>
            <div>
              <small className="text-muted d-block">Lighthouse</small>
              <small className="fw-semibold">v{meta.lighthouseVersion}</small>
            </div>
            <div>
              <small className="text-muted d-block">Cached</small>
              <small className="fw-semibold">{meta.cached ? 'Yes' : 'No'}</small>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ScanResultPage
