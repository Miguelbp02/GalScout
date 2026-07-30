function PlayerDetailSkeleton() {
  return (
    <section aria-hidden="true" className="card player-detail-summary mt-4 shadow-sm">
      <div className="card-body p-3">
        <div className="player-detail-overview">
          <div className="player-detail-identity">
            <div className="skeleton" style={{ width: 118, height: 118, borderRadius: '50%', flexShrink: 0 }} />
            <div className="player-detail-data w-100">
              <div className="skeleton skeleton-line" style={{ width: '55%', height: 20 }} />
              <div className="skeleton skeleton-line" style={{ width: '40%' }} />
              <div className="skeleton skeleton-line" style={{ width: '45%' }} />
              <div className="skeleton skeleton-line" style={{ width: '35%', marginBottom: 0 }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: 165, height: 165, borderRadius: '50%', margin: '0 auto' }} />
          <div className="skeleton" style={{ width: 190, height: 168, borderRadius: 16, margin: '0 auto' }} />
        </div>
      </div>
    </section>
  )
}

export default PlayerDetailSkeleton
