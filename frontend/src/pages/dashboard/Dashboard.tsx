import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const userType = user?.type ?? 'free'
      const [statsRes, historyRes] = await Promise.allSettled([
        apiService.getDashboardStats(userType),
        apiService.getScanHistory(userType, 1, 5)
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value)

      if (historyRes.status === 'fulfilled') {
        const h = historyRes.value
        const rows = h?.data || []
        setRecentScans(rows.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const isGo = user?.type === 'go'

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {user?.name}!</p>
        </div>
        <button className="glow-btn" onClick={() => navigate('/scan')}>
          <i className="bi bi-search me-2" />
          New Scan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-lg-3 col-md-6">
          <StatCard
            icon="bi bi-graph-up"
            title="Total Scans"
            value={stats?.totalScans || 0}
            subtitle="All time"
            color="var(--primary)"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard
            icon="bi bi-speedometer2"
            title="Avg Carbon Score"
            value={stats?.avgCarbonScore || 0}
            subtitle="Across all scans"
            color="var(--secondary)"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard
            icon="bi bi-cloud"
            title="Total CO₂"
            value={`${Number(stats?.totalCo2 || 0).toFixed(2)}g`}
            subtitle="Emissions tracked"
            color="var(--warning)"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard
            icon="bi bi-calendar-check"
            title="This Month"
            value={stats?.thisMonthScans || 0}
            subtitle={isGo ? 'Unlimited' : 'Free plan'}
            color="var(--success)"
          />
        </div>
        {/* GO-only extra stats */}
        {isGo && stats?.totalPagesScanned != null && (
          <div className="col-lg-3 col-md-6">
            <StatCard
              icon="bi bi-files"
              title="Pages Scanned"
              value={stats.totalPagesScanned}
              subtitle="Across all crawls"
              color="var(--info)"
            />
          </div>
        )}
        {isGo && stats?.completedCrawls != null && (
          <div className="col-lg-3 col-md-6">
            <StatCard
              icon="bi bi-check-circle"
              title="Completed Crawls"
              value={stats.completedCrawls}
              subtitle={`of ${stats.totalScans} total`}
              color="var(--success)"
            />
          </div>
        )}
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isGo && (
        <div className="glass-card mb-5 border-primary">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h4 className="mb-2">
                <i className="bi bi-star-fill text-warning me-2" />
                Upgrade to GO Plan
              </h4>
              <p className="text-muted mb-0">
                Get unlimited scans, full website crawl analysis, advanced analytics, and export reports
              </p>
            </div>
            <div className="col-md-4 text-end">
              <button className="glow-btn" onClick={() => navigate('/billing')}>
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className="glass-card">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Recent Scans</h4>
          <button className="btn btn-outline-primary" onClick={() => navigate('/history')}>
            View All
          </button>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted mb-3" />
            <h5 className="text-muted">No scans yet</h5>
            <p className="text-muted mb-4">Start by scanning your first website</p>
            <button className="glow-btn" onClick={() => navigate('/scan')}>
              Scan Now
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Grade</th>
                  <th>CO₂</th>
                  <th>Score</th>
                  {isGo && <th>Status</th>}
                  {isGo && <th>Pages</th>}
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan: any) => {
                  const grade = isGo
                    ? scan.reportJson?.summary?.grade || 'N/A'
                    : scan.grade || scan.reportJson?.summary?.grade || 'N/A'
                  const co2 = isGo
                    ? scan.reportJson?.summary?.averageCo2 || 0
                    : scan.co2Grams || scan.reportJson?.summary?.co2Grams || 0
                  const score = isGo
                    ? scan.reportJson?.summary?.averageCarbonScore || 0
                    : scan.carbonScore || scan.reportJson?.summary?.carbonScore || 0
                  const url = isGo ? scan.rootUrl : scan.url

                  return (
                    <tr key={scan.id}>
                      <td>
                        <i className="bi bi-globe me-2" />
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '250px' }}>{url}</span>
                      </td>
                      <td>
                        <span className={`badge badge-custom grade-${grade[0]}`}>{grade}</span>
                      </td>
                      <td>{Number(co2).toFixed(4)}g</td>
                      <td>{score}</td>
                      {isGo && (
                        <td>
                          <span className={`badge ${
                            scan.status === 'completed' ? 'bg-success' :
                            scan.status === 'failed' ? 'bg-danger' :
                            scan.status === 'paused' ? 'bg-warning' : 'bg-secondary'
                          }`}>{scan.status}</span>
                        </td>
                      )}
                      {isGo && <td>{scan.pagesScanned}/{scan.totalPages}</td>}
                      <td><small>{new Date(scan.createdAt).toLocaleDateString()}</small></td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(isGo ? `/crawl-details/${scan.id}` : `/report/${scan.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
