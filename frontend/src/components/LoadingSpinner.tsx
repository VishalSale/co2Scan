const LoadingSpinner = ({ size = 50 }: { size?: number }) => {
  return (
    <div className="d-flex justify-content-center align-items-center p-5">
      <div className="loading-spinner" style={{ width: size, height: size }} />
    </div>
  )
}

export default LoadingSpinner
