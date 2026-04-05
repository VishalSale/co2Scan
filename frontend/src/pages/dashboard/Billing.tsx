import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api.service'
import LoadingSpinner from '../../components/LoadingSpinner'

const Billing = () => {
  const { user } = useAuth()
  const [billing, setBilling] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBilling()
  }, [])

  const loadBilling = async () => {
    try {
      const data = await apiService.getBilling()
      setBilling(data)
    } catch (error) {
      console.error('Failed to load billing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = () => {
    alert('Upgrade feature coming soon! This will integrate with Stripe/PayPal.')
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      alert('Cancel subscription feature coming soon!')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="fade-in">
      <h2 className="mb-4">Billing & Subscription</h2>

      {/* Current Plan */}
      <div className="glass-card mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h4 className="mb-2">
              {user?.planType === 'GO' ? '⭐ GO Plan' : '🆓 Free Plan'}
            </h4>
            <p className="text-muted mb-0">
              {user?.planType === 'GO' 
                ? 'Unlimited scans, advanced analytics, and priority support'
                : '10 scans per day with basic features'
              }
            </p>
          </div>
          <div className="col-md-4 text-end">
            <h2 className="text-primary mb-0">
              {user?.planType === 'GO' ? '$29/mo' : 'Free'}
            </h2>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className={`glass-card h-100 ${user?.planType === 'FREE' ? 'border-primary' : ''}`}>
            <div className="text-center mb-4">
              <h3 className="mb-2">Free Plan</h3>
              <h2 className="text-primary mb-3">$0<small className="text-muted">/month</small></h2>
            </div>
            <ul className="list-unstyled mb-4">
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                10 scans per day
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Full carbon analysis
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Last 10 scans history
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Quick win recommendations
              </li>
              <li className="mb-2 text-muted">
                <i className="bi bi-x-circle me-2" />
                Advanced analytics
              </li>
              <li className="mb-2 text-muted">
                <i className="bi bi-x-circle me-2" />
                Export reports
              </li>
            </ul>
            {user?.planType === 'FREE' && (
              <div className="badge bg-primary w-100 py-2">Current Plan</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className={`glass-card h-100 ${user?.planType === 'GO' ? 'border-primary' : ''}`}>
            <div className="text-center mb-4">
              <h3 className="mb-2">GO Plan</h3>
              <h2 className="text-primary mb-3">$29<small className="text-muted">/month</small></h2>
            </div>
            <ul className="list-unstyled mb-4">
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Unlimited scans
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Full website crawling
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Unlimited history
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Advanced analytics
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Export reports (PDF/CSV/JSON)
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle-fill text-success me-2" />
                Priority support
              </li>
            </ul>
            {user?.planType === 'GO' ? (
              <div className="badge bg-primary w-100 py-2">Current Plan</div>
            ) : (
              <button className="glow-btn w-100" onClick={handleUpgrade}>
                Upgrade to GO
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {user?.planType === 'GO' && (
        <>
          <div className="glass-card mb-4">
            <h5 className="mb-4">Payment Method</h5>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <i className="bi bi-credit-card fs-2 text-primary me-3" />
                <div>
                  <div className="fw-bold">•••• •••• •••• 4242</div>
                  <small className="text-muted">Expires 12/25</small>
                </div>
              </div>
              <button className="btn btn-outline-primary">
                Update
              </button>
            </div>
          </div>

          {/* Billing History */}
          <div className="glass-card mb-4">
            <h5 className="mb-4">Billing History</h5>
            <div className="table-responsive">
              <table className="table table-custom">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Jan 1, 2026</td>
                    <td>GO Plan - Monthly</td>
                    <td>$29.00</td>
                    <td><span className="badge bg-success">Paid</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-download me-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Dec 1, 2025</td>
                    <td>GO Plan - Monthly</td>
                    <td>$29.00</td>
                    <td><span className="badge bg-success">Paid</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-download me-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cancel Subscription */}
          <div className="glass-card border-danger">
            <h5 className="text-danger mb-3">
              <i className="bi bi-exclamation-triangle me-2" />
              Cancel Subscription
            </h5>
            <p className="text-muted mb-3">
              Your subscription will remain active until the end of the current billing period.
            </p>
            <button className="btn btn-outline-danger" onClick={handleCancel}>
              Cancel Subscription
            </button>
          </div>
        </>
      )}

      {/* Upgrade CTA for Free Users */}
      {user?.planType === 'FREE' && (
        <div className="glass-card border-primary text-center">
          <h4 className="mb-3">Ready to Go Unlimited?</h4>
          <p className="text-muted mb-4">
            Upgrade to GO and unlock unlimited scans, advanced analytics, and more
          </p>
          <button className="glow-btn btn-lg" onClick={handleUpgrade}>
            Upgrade to GO - $29/month
          </button>
        </div>
      )}
    </div>
  )
}

export default Billing
