import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PricingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const plans = [
    {
      name: 'Guest',
      price: 'Free',
      description: 'Try before you sign up',
      features: [
        'Single page scan',
        'Basic carbon metrics',
        'No history tracking',
        'Limited recommendations'
      ],
      cta: 'Try Now',
      action: () => navigate('/'),
      popular: false
    },
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for personal projects',
      features: [
        '10 scans per day',
        'Full carbon analysis',
        'Last 10 scans history',
        'Quick win recommendations',
        'Performance metrics'
      ],
      cta: 'Get Started',
      action: () => navigate(isAuthenticated ? '/dashboard' : '/register'),
      popular: false
    },
    {
      name: 'GO',
      price: '$29',
      period: '/month',
      description: 'For professionals and teams',
      features: [
        'Unlimited scans',
        'Full website crawling',
        'Unlimited history',
        'Advanced analytics',
        'Export reports (PDF/CSV/JSON)',
        'Priority support',
        'API access'
      ],
      cta: 'Upgrade to GO',
      action: () => navigate(isAuthenticated ? '/billing' : '/register'),
      popular: true
    }
  ]

  return (
    <div className="container py-5">
      <div className="text-center mb-5 fade-in">
        <h1 className="display-4 fw-bold mb-3">Simple, Transparent Pricing</h1>
        <p className="lead text-muted">Choose the plan that fits your needs</p>
      </div>

      <div className="row g-4 justify-content-center">
        {plans.map((plan, index) => (
          <div key={plan.name} className="col-lg-4 col-md-6 slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className={`glass-card h-100 position-relative ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <div className="position-absolute top-0 start-50 translate-middle">
                  <span className="badge bg-primary px-3 py-2">Most Popular</span>
                </div>
              )}
              
              <div className="text-center mb-4">
                <h3 className="mb-3">{plan.name}</h3>
                <div className="mb-2">
                  <span className="display-4 fw-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted">{plan.period}</span>}
                </div>
                <p className="text-muted">{plan.description}</p>
              </div>

              <ul className="list-unstyled mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="mb-3">
                    <i className="bi bi-check-circle-fill text-primary me-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={plan.action}
                className={`glow-btn w-100 ${plan.popular ? '' : 'btn-outline-primary'}`}
              >
                {plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <section className="mt-5 pt-5">
        <h2 className="text-center mb-5">Frequently Asked Questions</h2>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="glass-card">
              <div className="mb-4">
                <h5>What's included in the Free plan?</h5>
                <p className="text-muted">
                  The Free plan includes 10 scans per day with full carbon analysis, performance metrics, and quick win recommendations.
                </p>
              </div>
              <div className="mb-4">
                <h5>Can I upgrade or downgrade anytime?</h5>
                <p className="text-muted">
                  Yes! You can upgrade to GO or downgrade to Free at any time from your billing page.
                </p>
              </div>
              <div className="mb-4">
                <h5>What's the difference between single page and website scan?</h5>
                <p className="text-muted">
                  Single page scans analyze one URL. Website scans (GO plan) crawl your entire site and provide aggregate metrics.
                </p>
              </div>
              <div>
                <h5>Do you offer refunds?</h5>
                <p className="text-muted">
                  Yes, we offer a 30-day money-back guarantee for GO plan subscriptions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PricingPage
