import './Header.css';
import { METRO_CITIES } from '../../data/metroData';

const TrainIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--brown)'}}>
    <rect x="4" y="3" width="16" height="13" rx="3"/>
    <path d="M4 11h16M8 11V3M16 11V3"/>
    <circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/>
    <path d="M6.5 19h11M5 16l1.5 3M19 16l-1.5 3"/>
  </svg>
);

export default function Header({ currentCity, onCityChange }) {
  return (
    <header className="header">
      <div className="header-brand">
        <TrainIcon />
        <div className="header-brand-text">
          <div className="header-brand-title">India Metro</div>
          <div className="header-brand-sub">Route Planner</div>
        </div>
      </div>
      <nav className="header-cities">
        {Object.entries(METRO_CITIES).map(([key, city]) => (
          <button
            key={key}
            className={`city-tab${currentCity === key ? ' active' : ''}`}
            onClick={() => onCityChange(key)}
          >
            {city.name.split(' ')[0]}
          </button>
        ))}
      </nav>
      <div className="header-live">
        <span className="live-dot" />
        Live Network
      </div>
    </header>
  );
}
