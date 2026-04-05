interface StatCardProps {
  icon: string
  title: string
  value: string | number
  subtitle?: string
  color?: string
}

const StatCard = ({ icon, title, value, subtitle, color = 'var(--primary)' }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20`, color }}>
        <i className={icon} />
      </div>
      <h6 className="text-muted mb-2">{title}</h6>
      <h2 className="mb-1">{value}</h2>
      {subtitle && <small className="text-muted">{subtitle}</small>}
    </div>
  )
}

export default StatCard
