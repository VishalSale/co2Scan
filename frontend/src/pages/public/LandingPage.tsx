import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'

const LandingPage = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    try {
      const result = await apiService.scanWebsiteGuest(url)
      navigate('/scan-result', { state: { result, url } })
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to scan website')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <section className="text-center py-5 fade-in">
        <h1 className="display-3 fw-bold mb-4">
          Measure Your Website's
          <br />
          <span style={{ 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Carbon Footprint
          </span>
        </h1>
        <p className="lead text-muted mb-5">
          Analyze your website's environmental impact and get actionable insights to reduce CO₂ emissions
        </p>

        {/* Scan Form */}
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <form onSubmit={handleScan} className="glass-card">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-transparent border-0">
                  <i className="bi bi-globe text-primary" />
                </span>
                <input
                  type="url"
                  className="form-control border-0"
                  placeholder="Enter website URL (e.g., https://example.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                />
                <button type="submit" className="glow-btn" disabled={loading}>
                  {loading ? 'Scanning...' : 'Scan Now'}
                  <i className="bi bi-arrow-right ms-2" />
                </button>
              </div>
            </form>
            {loading && <LoadingSpinner />}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 mt-5">
        <h2 className="text-center mb-5">Why Carbon Matters</h2>
        <div className="row g-4">
          <div className="col-md-4 slide-up">
            <div className="glass-card text-center h-100">
              <div className="stat-icon mx-auto" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)' }}>
                <i className="bi bi-speedometer2" />
              </div>
              <h4 className="mb-3">Performance Analysis</h4>
              <p className="text-muted">
                Get detailed insights on page size, load time, and resource usage
              </p>
            </div>
          </div>
          <div className="col-md-4 slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card text-center h-100">
              <div className="stat-icon mx-auto" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--secondary)' }}>
                <i className="bi bi-graph-up" />
              </div>
              <h4 className="mb-3">CO₂ Tracking</h4>
              <p className="text-muted">
                Measure carbon emissions from data transfer and energy consumption
              </p>
            </div>
          </div>
          <div className="col-md-4 slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card text-center h-100">
              <div className="stat-icon mx-auto" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                <i className="bi bi-lightbulb" />
              </div>
              <h4 className="mb-3">Quick Wins</h4>
              <p className="text-muted">
                Get actionable recommendations to reduce your carbon footprint
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-5 mt-5">
        <div className="glass-card text-center">
          <div className="row">
            <div className="col-md-4 border-end border-secondary">
              <h2 className="text-primary mb-2">2.1 MB</h2>
              <p className="text-muted">Average Website Size</p>
            </div>
            <div className="col-md-4 border-end border-secondary">
              <h2 className="text-primary mb-2">1.6g CO₂</h2>
              <p className="text-muted">Per Page Load</p>
            </div>
            <div className="col-md-4">
              <h2 className="text-primary mb-2">30%</h2>
              <p className="text-muted">Potential Reduction</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-5 mt-5">
        <div className="glass-card">
          <h2 className="mb-4">Ready to Make a Difference?</h2>
          <p className="lead text-muted mb-4">
            Join thousands of developers building a greener web
          </p>
          <button className="glow-btn btn-lg" onClick={() => navigate('/register')}>
            Get Started Free
            <i className="bi bi-arrow-right ms-2" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
