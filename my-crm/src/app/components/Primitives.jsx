export function MiniLineChart({ data, accent = 'var(--primary)' }) {
  const points = data.map((value, index) => `${(index / (data.length - 1)) * 100},${100 - value}`).join(' ')

  return (
    <svg viewBox="0 0 100 100" className="mini-chart" aria-hidden="true">
      <polyline fill="none" stroke="rgba(37, 99, 235, 0.14)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polyline fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

export function SparkBars({ values }) {
  return <div className="spark-bars" aria-hidden="true">{values.map((value, index) => <span key={`${value}-${index}`} style={{ height: `${value}%` }} />)}</div>
}

export function Pill({ children, tone = 'default' }) {
  return <span className={`pill tone-${tone}`}>{children}</span>
}

export function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="section-head modal-head">
          <div>
            <p className="eyebrow">{subtitle}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}