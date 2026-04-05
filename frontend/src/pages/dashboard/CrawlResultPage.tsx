import { useLocation, useNavigate } from 'react-router-dom'
import GradeBadge from '../../components/GradeBadge'
import ScoreCircle from '../../components/ScoreCircle'

const CrawlResultPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { result, url } = location.state as { result: any; url: string } || {}

  if (!result || !result.summary) {
    return (
      <div className="container py-5 text-center">
        <h3>No crawl result found</h3>
        <button className="glow-btn mt-3" onClick={() => navigate('/scan')}>Go Back</button>
      </div>
    )
  }

  const { summary, pages, meta } = result

  return (
    <div className="fade-in container py-5">

      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="mb-3">Full Site Crawl Results</h1>
        <p className="lead text-muted">{url || result.site}</p>
        <small className="text-muted">
          Scanned {new Date(meta?.scannedAt).toLocaleString()} • {result.pagesScanned} pages
        </small>
      </div>

      {/* Summary Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4 slide-up">
          <div className="glass-card text-center">
            <h6 className="text-muted mb-3">Average Carbon Grade</h6>
            <GradeBadge grade={summary.grade} size={100} />
          </div>
        </div>
        <div className="col-md-4 slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card text-center">
            <h6 className="text-muted mb-3">Average Carbon Score</h6>
            <ScoreCircle score={summary.averageCarbonScore} label="Score" />
          </div>
        </div>
        <div className="col-md-4 slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card text-center">
            <h6 className="text-muted mb-3">Average CO₂ / Page</h6>
            <h1 className="text-primary mb-2">{summary.averageCo2?.toFixed(2)}g</h1>
            <p className="text-muted mb-0">per page load</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)' }}>
              <i className="bi bi-files" />
            </div>
            <h6 className="text-muted mb-2">Pages Scanned</h6>
            <h3>{summary.pagesS