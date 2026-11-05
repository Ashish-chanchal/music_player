export const NAV = [
  { view: 'home', icon: 'fa-circle-play', label: 'Listen Now', short: 'Listen Now' },
  { view: 'browse', icon: 'fa-table-cells-large', label: 'Browse', short: 'Browse' },
  { view: 'library', icon: 'fa-compact-disc', label: 'Songs', short: 'Songs' },
  { view: 'favorites', icon: 'fa-heart', label: 'Liked Songs', short: 'Liked' },
];

export function SearchBox({ value, onChange, className = '' }) {
  return (
    <div className={`search ${className}`}>
      <i className="fa-solid fa-magnifying-glass" />
      <input
        type="search"
        placeholder="Search"
        autoComplete="off"
        aria-label="Search songs and artists"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-search
      />
    </div>
  );
}

export function Sidebar({ view, onView, query, onQuery, favCount, onToggleTheme }) {
  const item = ({ view: v, icon, label }) => (
    <button key={v} className={`nav-item${view === v ? ' active' : ''}`} onClick={() => onView(v)}>
      <i className={`fa-solid ${icon}`} /><span>{label}</span>
      {v === 'favorites' && <em className="nav-count">{favCount}</em>}
    </button>
  );
  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="brand">
        <span className="brand-mark"><i className="fa-solid fa-music" /></span>
        <span className="brand-name">VibePulse</span>
      </div>
      <SearchBox value={query} onChange={onQuery} />
      <nav className="nav" aria-label="Main">
        {NAV.slice(0, 2).map(item)}
        <p className="nav-label">Library</p>
        {NAV.slice(2).map(item)}
      </nav>
      <div className="sidebar-foot">
        <button className="theme-btn" onClick={onToggleTheme} aria-label="Toggle light and dark theme">
          <i className="fa-solid fa-circle-half-stroke" /><span>Appearance</span>
        </button>
        <p className="sidebar-credit">Open catalogue by <strong>Audius</strong></p>
      </div>
    </aside>
  );
}

export function TabBar({ view, onView }) {
  return (
    <nav className="tabbar" aria-label="Mobile">
      {NAV.map(({ view: v, icon, short }) => (
        <button key={v} className={`tab${view === v ? ' active' : ''}`} onClick={() => onView(v)}>
          <i className={`fa-solid ${icon}`} /><span>{short}</span>
        </button>
      ))}
    </nav>
  );
}
