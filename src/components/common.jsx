import { useEffect, useRef, useState } from 'react';
import { genCover } from '../lib/format';

/** <img> that swaps in a generated gradient cover if the real artwork fails to load. */
export function Cover({ src, alt = '', ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img src={failed ? genCover(src) : src} alt={alt} onError={() => setFailed(true)} {...props} />;
}

/** Range input that draws its filled portion through the --pct custom property. */
export function Slider({ className = '', min = 0, max = 1000, value, ...props }) {
  const pct = ((value - min) / (max - min)) * 100;
  return <input type="range" className={`slider ${className}`} min={min} max={max} value={value} style={{ '--pct': `${pct}%` }} {...props} />;
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      <i className={`fa-solid ${icon}`} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <button className="btn" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

export function SkeletonCards({ count }) {
  return Array.from({ length: count }, (_, i) => (
    <div className="card sk-card" key={i}>
      <div className="card-art sk" />
      <div className="sk sk-line" />
      <div className="sk sk-line s" />
    </div>
  ));
}

export function SkeletonRows({ count }) {
  return (
    <ol className="track-list">
      {Array.from({ length: count }, (_, i) => (
        <li className="track skeleton" key={i}>
          <span />
          <div className="c-title">
            <div className="sk sk-img" />
            <div className="t-text" style={{ flex: 1 }}><div className="sk sk-line" /><div className="sk sk-line s" /></div>
          </div>
          <span className="c-album" /><span /><span />
        </li>
      ))}
    </ol>
  );
}

/** A titled, horizontally scrolling row with prev/next arrows. */
export function Shelf({ title, className = '', children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        <div className="arrows">
          <button className="arrow" onClick={() => scroll(-1)} aria-label="Scroll left"><i className="fa-solid fa-chevron-left" /></button>
          <button className="arrow" onClick={() => scroll(1)} aria-label="Scroll right"><i className="fa-solid fa-chevron-right" /></button>
        </div>
      </div>
      <div className={`shelf ${className}`} ref={ref}>{children}</div>
    </section>
  );
}

export function ShelfError({ onRetry }) {
  return (
    <p style={{ padding: '8px 0', color: 'var(--text-3)' }}>
      Couldn’t load this shelf. <button className="retry" onClick={onRetry}>Retry</button>
    </p>
  );
}
