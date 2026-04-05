interface ScoreCircleProps {
  score: number
  label?: string
  size?: number
}

const ScoreCircle = ({ score, label = 'Score', size = 150 }: ScoreCircleProps) => {
  const progress = Math.min(100, Math.max(0, score))

  return (
    <div 
      className="score-circle"
      style={{ 
        width: size, 
        height: size,
        '--progress': `${progress}%`
      } as React.CSSProperties}
    >
      <div className="score-circle-content">
        <div style={{ fontSize: size * 0.25, fontWeight: 'bold' }}>{score}</div>
        <div style={{ fontSize: size * 0.1, color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}

export default ScoreCircle
