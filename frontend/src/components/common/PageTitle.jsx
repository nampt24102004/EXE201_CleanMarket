function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <div className="d-inline-flex align-items-center gap-1 badge-chip mb-2">
          <span className="live-dot" />
          <span>{eyebrow}</span>
        </div>
      ) : null}
      <h2 className="section-title mb-2">{title}</h2>
      {description ? <p className="text-secondary fs-6 mb-0">{description}</p> : null}
    </div>
  )
}

export default PageTitle
