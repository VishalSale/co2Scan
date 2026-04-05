import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10b981', 'A': '#22c55e', 'B': '#84cc16',
  'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444', 'N/A': '#64748b'
}
const RESOURCE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

const Analytics = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (user?.type !== 'go') {
      setLoading(false)
      return
    }
    try {
      const res = await apiService.getAnalytics(1, 100)
      setScans(res?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (user?.type !== 'go') {
    return (
      <div className="fade-in text-center">
        <div className="glass-card py-5">
          <i className="bi bi-lock-fill display-1 text-primary mb-3" />
          <h4 className="mb-2">Analytics is a GO feature</h4>
          <p className="text-muted mb-4">Upgrade to GO to access detailed analytics, trends, and insights across all your scans.</p>
          <button className="glow-btn" onClick={() => navigate('/billing')}>Upgrade to GO</button>
        </div>
      </div>
    )
  }

  if (scans.length === 0) {
    return (
      <div className="fade-in text-center">
        <div className="glass-card py-5">
          <i className="bi bi-graph-up display-1 text-muted mb-3" />
          <h4 className="text-muted">No scan data yet</h4>
          <p className="text-muted mb-4">Run some scans to see analytics</p>
          <button className="glow-btn" onClick={() => navigate('/scan')}>Scan Now</button>
        </div>
      </div>
    )
  }

  const isGo = true

  // CO₂ + carbon score trend (last 20, oldest first)
  const trendData = [...scans]
    .slice(0, 20).reverse()
    .map((s, i) => ({
      name: new Date(s.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      index: i + 1,
      co2: Number(s.reportJson?.summary?.averageCo2 || 0).toFixed(4),
      score: s.reportJson?.summary?.averageCarbonScore || 0,
      url: s.rootUrl,
    }))

  // Grade distribution
  const gradeCounts: Record<string, number> = {}
  scans.forEach(s => {
    const g = s.reportJson?.summary?.grade || 'N/A'
    gradeCounts[g] = (gradeCounts[g] || 0) + 1
  })
  const gradeData = Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => ['A+','A','B','C','D','F','N/A'].indexOf(a.grade) - ['A+','A','B','C','D','F','N/A'].indexOf(b.grade))

  // Top 5 by CO₂
  const top5 = [...scans]
    .sort((a, b) => (b.reportJson?.summary?.averageCo2 || 0) - (a.reportJson?.summary?.averageCo2 || 0))
    .slice(0, 5)
    .map(s => ({
      url: (s.rootUrl || '').replace(/https?:\/\//, '').slice(0, 30),
      co2: Number(s.reportJson?.summary?.averageCo2 || 0).toFixed(4),
    }))

  // Average resource breakdown across all pages
  const resourceTotals: Record<string, number> = {}
  scans.forEach(s => {
    const pages: any[] = s.pages || []
    pages.forEach(p => {
      const byType: any[] = p.reportJson?.breakdown?.byType || []
      byType.forEach((item: any) => {
        if (item.type !== 'total') {
          resourceTotals[item.type] = (resourceTotals[item.type] || 0) + (item.sizeBytes || 0)
        }
      })
    })
  })
  const resourceData = Object.entries(resourceTotals)
    .map(([type, bytes]) => ({ type, sizeMb: Number((bytes / (1024 * 1024)).toFixed(2)) }))
    .filter(r => r.sizeMb > 0)
    .sort((a, b) => b.sizeMb - a.sizeMb)
    .slice(0, 6)

  // Summary stats
  const totalScans = scans.length
  const avgCo2 = scans.reduce((s, r) => s + Number(r.reportJson?.summary?.averageCo2 || 0), 0) / totalScans
  const avgScore = scans.reduce((s, r) => s + Number(r.reportJson?.summary?.averageCarbonScore || 0), 0) / totalScans
  const bestGrade = gradeData[0]?.grade || 'N/A'
  const industryAvg = 1.6
  const betterThanAvg = avgCo2 < industryAvg

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Analytics</h2>
          <p className="text-muted mb-0">Insights across {totalScans} scan{totalScans !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <div className="glass-card text-center">
            <small className="text-muted d-block mb-1">Total Crawls</small>
            <h3 className="text-primary mb-0">{totalScans}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="glass-card text-center">
            <small className="text-muted d-block mb-1">Avg CO₂/page</small>
            <h3 className="text-warning mb-0">{avgCo2.toFixed(4)}g</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="glass-card text-center">
            <small className="text-muted d-block mb-1">Avg Carbon Score</small>
            <h3 className="text-success mb-0">{avgScore.toFixed(0)}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="glass-card text-center">
            <small className="text-muted d-block mb-1">vs Industry Avg</small>
            <h3 className={betterThanAvg ? 'text-success mb-0' : 'text-danger mb-0'}>
              {betterThanAvg ? 'Better' : 'Worse'}
            </h3>
            <small className="text-muted">avg: {industryAvg}g</small>
          </div>
        </div>
      </div>

      {/* CO₂ Trend */}
      {trendData.length > 1 && (
        <div className="glass-card mb-4">
          <h5 className="mb-4"><i className="bi bi-graph-up text-primary me-2" />CO₂ Trend Over Time</h5>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} unit="g" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(val: any) => [`${val}g`, 'CO₂']}
              />
              <Line type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Carbon Score Trend */}
      {trendData.length > 1 && (
        <div className="glass-card mb-4">
          <h5 className="mb-4"><i className="bi bi-speedometer2 text-secondary me-2" />Carbon Score Trend</h5>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(val: any) => [val, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="row g-4 mb-4">
        {/* Grade Distribution */}
        {gradeData.length > 0 && (
          <div className="col-md-6">
            <div className="glass-card h-100">
              <h5 className="mb-4"><i className="bi bi-bar-chart text-warning me-2" />Grade Distribution</h5>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="grade" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(val: any) => [val, 'Crawls']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeData.map((entry, i) => (
                      <Cell key={i} fill={GRADE_COLORS[entry.grade] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Resource Breakdown Pie */}
        {resourceData.length > 0 && (
          <div className="col-md-6">
            <div className="glass-card h-100">
              <h5 className="mb-4"><i className="bi bi-pie-chart text-primary me-2" />Resource Type Breakdown</h5>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={resourceData} dataKey="sizeMb" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {resourceData.map((_, i) => (
                      <Cell key={i} fill={RESOURCE_COLORS[i % RESOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}
                    formatter={(val: any) => [`${val} MB`, 'Size']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top 5 Heaviest Sites */}
      {top5.length > 0 && (
        <div className="glass-card mb-4">
          <h5 className="mb-4"><i className="bi bi-exclamation-triangle text-danger me-2" />Top 5 Highest CO₂ Sites</h5>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" unit="g" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <YAxis type="category" dataKey="url" width={160} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}
                formatter={(val: any) => [`${val}g`, 'CO₂']}
              />
              <Bar dataKey="co2" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Industry Comparison */}
      <div className="glass-card">
        <h5 className="mb-3"><i className="bi bi-globe2 text-primary me-2" />Industry Comparison</h5>
        <div className="row g-4 align-items-center">
          <div className="col-md-6">
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small>Your average</small>
                <small className={betterThanAvg ? 'text-success' : 'text-danger'}>{avgCo2.toFixed(4)}g</small>
              </div>
              <div className="progress" style={{ height: '10px' }}>
                <div className="progress-bar bg-primary" style={{ width: `${Math.min((avgCo2 / (industryAvg * 2)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="d-flex justify-content-between mb-1">
                <small>Industry average</small>
                <small className="text-muted">{industryAvg}g</small>
              </div>
              <div className="progress" style={{ height: '10px' }}>
                <div className="progress-bar bg-secondary" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
          <div className="col-md-6 text-center">
            <h2 className={betterThanAvg ? 'text-success' : 'text-danger'}>
              {betterThanAvg
                ? `${Math.round(((industryAvg - avgCo2) / industryAvg) * 100)}% better`
                : `${Math.round(((avgCo2 - industryAvg) / industryAvg) * 100)}% worse`}
            </h2>
            <p className="text-muted mb-0">than industry average</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
