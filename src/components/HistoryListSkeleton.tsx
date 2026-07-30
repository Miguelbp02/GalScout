interface HistoryListSkeletonProps {
  filas?: number
  className?: string
}

function HistoryListSkeleton({ filas = 3, className = 'observation-item' }: HistoryListSkeletonProps) {
  return (
    <div aria-hidden="true" className="d-grid gap-3">
      {Array.from({ length: filas }).map((_, indice) => (
        <div className={className} key={indice}>
          <div className="skeleton-row">
            <div className="skeleton skeleton-line" style={{ width: '8rem', height: 14, marginBottom: 0 }} />
            <div className="skeleton skeleton-line" style={{ width: '3.5rem', height: 14, marginBottom: 0 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default HistoryListSkeleton
