interface GradeBadgeProps {
  grade: string
  size?: number
}

const GradeBadge = ({ grade, size = 80 }: GradeBadgeProps) => {
  const getGradeClass = (grade: string) => {
    if (grade.startsWith('A')) return 'grade-A'
    if (grade.startsWith('B')) return 'grade-B'
    if (grade.startsWith('C')) return 'grade-C'
    if (grade.startsWith('D')) return 'grade-D'
    return 'grade-F'
  }

  return (
    <div 
      className={`grade-badge ${getGradeClass(grade)}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {grade}
    </div>
  )
}

export default GradeBadge
