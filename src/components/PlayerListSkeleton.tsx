import PlayerCardSkeleton from './PlayerCardSkeleton'

interface PlayerListSkeletonProps {
  cantidad?: number
}

function PlayerListSkeleton({ cantidad = 6 }: PlayerListSkeletonProps) {
  return (
    <section aria-hidden="true" className="py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="skeleton skeleton-line" style={{ width: '10rem', height: 20, marginBottom: 0 }} />
        <div className="skeleton skeleton-line" style={{ width: '5rem', height: 14, marginBottom: 0 }} />
      </div>

      <div className="row g-4">
        {Array.from({ length: cantidad }).map((_, indice) => (
          <div className="col-12 col-md-6 col-lg-4" key={indice}>
            <PlayerCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  )
}

export default PlayerListSkeleton
