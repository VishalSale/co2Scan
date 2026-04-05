import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'

const ExportReport = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scans, setScans] = useState<any[]>([])
  const [selectedScan, setSelectedScan] = useState<string>('')
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('json')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadScans()
  }, [])

  const loadScans = async () => {
    try {
      let rows: any[] = []
      if (user?.type === 'go') {
        const res = await apiService.getAnalytics(1, 50)
        rows = res?.data || []
      } else {
        const res = await apiService.getScanHistory('free', 1, 50)
        rows = res?.data || []
      }
      setScans(rows)
      if (rows.length > 0) setSelectedScan(String(rows[0].id))
    } catch (error) {
      console.error('Failed to load scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!selectedScan) return
    const scan = scans.find(s => String(s.id) === selectedScan)
    if (!scan) return

    setExporting(true)
    try {
      if (format === 'json') {
        // client-side JSON export from scan data
        const reportData = user?.type === 'go'
          ? { id: scan.id, url: scan.rootUrl, status: scan.status, reportJson: scan.reportJson, createdAt: scan.createdAt }
          : { id: scan.id, url: scan.url, grade: scan.grade, reportJson: scan.reportJson, createdAt: scan.createdAt }
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `carbon-report-${selectedScan}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (format === 'csv') {
        // client-side CSV export
        const r = scan.reportJson
        const summary = r?.summary || {}
        const rows = [
          ['Field', 'Value'],
          ['URL', user?.type === 'go' ? scan.rootUrl : scan.url],
          ['Grade', summary.grade || scan.grade || 'N/A'],
          ['Carbon Score', summary.averageCarbonScore ?? summary.carbonScore ?? scan.carbonScore ?? ''],
          ['CO2 (g)', summary.averageCo2 ?? summary.co2Grams ?? scan.co2Grams ?? ''],
          ['Page Size (MB)', summary.averagePageSizeMb ?? summary.pageSizeMb ?? scan.pageSizeMb ?? ''],
          ['Scanned At', scan.createdAt],
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `carbon-report-${selectedScan}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // PDF — call backend
        const blob = await apiService.exportReport(selectedScan, format)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `carbon-report-${selectedScan}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  if (user?.type !== 'go') {
    return (
      <div className="fade-in text-center">
        <div className="glass-card">
          <i className="bi bi-lock-fill display-1 text-primary mb-4" />
          <h3 className="mb-3">GO Plan Feature</h3>
          <p className="text-muted mb-4">
            Export reports in PDF, CSV, or JSON format is available for GO plan users
          </p>
          <button className="glow-btn" onClick={() => navigate('/billing')}>
            Upgrade to GO
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="mb-4">Export Report</h2>

          <div className="glass-card">
            {scans.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-inbox display-1 text-muted mb-3" />
                <p className="text-muted">No scans available to export</p>
                <button className="glow-btn" onClick={() => navigate('/scan')}>Scan Now</button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="form-label">Select Scan</label>
                  <select
                    className="form-select"
                    value={selectedScan}
                    onChange={(e) => setSelectedScan(e.target.value)}
                  >
                    {scans.map((scan) => (
                      <option key={scan.id} value={String(scan.id)}>
                        {(user?.type === 'go' ? scan.rootUrl : scan.url) || `Scan #${scan.id}`}
                        {' — '}
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected scan preview */}
                {selectedScan && (() => {
                  const s = scans.find(x => String(x.id) === selectedScan)
                  if (!s) return null
                  const grade = s.reportJson?.summary?.grade || s.grade || 'N/A'
                  const co2 = s.reportJson?.summary?.averageCo2 ?? s.reportJson?.summary?.co2Grams ?? s.co2Grams ?? 0
                  const score = s.reportJson?.summary?.averageCarbonScore ?? s.reportJson?.summary?.carbonScore ?? s.carbonScore ?? 0
                  return (
                    <div className="stat-card mb-4">
                      <div className="row g-3 text-center">
                        <div className="col-4">
                          <small className="text-muted d-block">Grade</small>
                          <span className={`badge badge-custom grade-${grade[0]} fs-6`}>{grade}</span>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">CO₂</small>
                          <span className="text-primary fw-bold">{Number(co2).toFixed(4)}g</span>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">Score</small>
                          <span className="text-success fw-bold">{score}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="mb-4">
                  <label className="form-label">Export Format</label>
                  <div className="row g-3">
                    {([
                      { key: 'json', icon: 'bi-file-code', color: '#3b82f6', bg: 'rgba(59,130,246,0.2)', label: 'JSON', sub: 'Raw data' },
                      { key: 'csv', icon: 'bi-file-spreadsheet', color: '#22c55e', bg: 'rgba(34,197,94,0.2)', label: 'CSV', sub: 'Excel compatible' },
                      { key: 'pdf', icon: 'bi-file-pdf', color: '#ef4444', bg: 'rgba(239,68,68,0.2)', label: 'PDF', sub: 'Printable report' },
                    ] as const).map(f => (
                      <div key={f.key} className="col-md-4">
                        <div
                          className={`stat-card ${format === f.key ? 'border-primary' : ''}`}
                          onClick={() => setFormat(f.key)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="stat-icon" style={{ background: f.bg, color: f.color }}>
                            <i className={`bi ${f.icon}`} />
                          </div>
                          <h6 className="mb-0">{f.label}</h6>
                          <small className="text-muted">{f.sub}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="glow-btn w-100"
                  onClick={handleExport}
                  disabled={exporting || !selectedScan}
                >
                  {exporting ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Exporting...</>
                  ) : (
                    <><i className="bi bi-download me-2" />Export as {format.toUpperCase()}</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportReport
