import './Header.css';

const CITIES = [
  { key: 'delhi',     label: 'Delhi'     },
  { key: 'mumbai',    label: 'Mumbai'    },
  { key: 'bengaluru', label: 'Bengaluru' },
  { key: 'chennai',   label: 'Chennai'   },
  { key: 'hyderabad', label: 'Hyderabad' },
  { key: 'kolkata',   label: 'Kolkata'   },
  { key: 'kochi',     label: 'Kochi'     },
  { key: 'jaipur',    label: 'Jaipur'    },
  { key: 'lucknow',   label: 'Lucknow'   },
  { key: 'ahmedabad', label: 'Ahmedabad' },
  { key: 'pune',      label: 'Pune'      },
  { key: 'nagpur',    label: 'Nagpur'    },
];

export default function Header({ currentCity, onCityChange }) {
  return (
    <header className="header">
      {/* Brand */}
      <div className="header-left">
        <span className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <rect x="3" y="3" width="18" height="13" rx="3"/>
            <path d="M8 16l-2 4M16 16l2 4M8 16h8"/>
            <circle cx="8.5" cy="10" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="15.5" cy="10" r="1.2" fill="currentColor" stroke="none"/>
            <line x1="3" y1="7" x2="21" y2="7"/>
          </svg>
        </span>
        <div className="header-brand">
          <span className="header-title">India Metro</span>
          <span className="header-sub">Route Planner</span>
        </div>
      </div>

      {/* City Tabs */}
      <nav className="city-tabs">
        {CITIES.map(c => (
          <button
            key={c.key}
            className={`city-tab${currentCity === c.key ? ' active' : ''}`}
            onClick={() => onCityChange(c.key)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {/* Live indicator */}
      <div className="header-right">
        <span className="live-dot" />
        <span className="live-text">Live Network</span>
      </div>
    </header>
  );
}
