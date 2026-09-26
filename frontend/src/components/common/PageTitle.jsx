function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      {eyebrow ? <div className="hero-kicker mb-2">{eyebrow}</div> : null}
      <h2 className="section-title">{title}</h2>
      {description ? <p className="text-secondary mb-0">{description}</p> : null}
    </div>
  )
}

export default PageTitle
