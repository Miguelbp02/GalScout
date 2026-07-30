function PlayerCardSkeleton() {
  return (
    <article aria-hidden="true" className="card h-100 shadow-sm">
      <div className="card-body">
        <div className="player-card-header">
          <div className="d-flex align-items-center gap-3">
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />
            <div>
              <div className="skeleton skeleton-line" style={{ width: '9rem', height: 15 }} />
              <div className="skeleton skeleton-line" style={{ width: '6.5rem' }} />
            </div>
          </div>
        </div>

        <div className="player-card-position">
          <div className="skeleton skeleton-line" style={{ width: '4.5rem', height: 9 }} />
          <div className="skeleton-tags">
            <div className="skeleton skeleton-tag" />
            <div className="skeleton skeleton-tag" />
          </div>
        </div>

        <div className="player-card-footer">
          <div className="skeleton skeleton-line" style={{ width: '5.5rem', height: 13, marginBottom: 0 }} />
        </div>
      </div>
    </article>
  )
}

export default PlayerCardSkeleton
