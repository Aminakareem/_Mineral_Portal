import ProductionRegionNav from './ProductionRegionNav';

export default function Header({
  activeView,
  onViewChange,
  productionRegionId,
  onProductionRegionChange,
}) {
  const tabs = [
    { id: 'mineral-production', label: 'Mineral-Production', icon: 'fa-chart-column' },
    { id: 'mineral-map', label: 'Mineral Map', icon: 'fa-map-location-dot' },
    { id: 'landslide', label: 'LandSlide', icon: 'fa-hill-rockslide' },
  ];

  const showProductionRegions = activeView === 'mineral-production';

  return (
    <header className={`app-header${showProductionRegions ? ' has-region-nav' : ''}`}>
      <div className="header-main-row">
        <div className="logo-area">
          <div className="logo-mark">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22" x2="12" y2="12" />
            </svg>
          </div>
          <div className="logo-text">
            <h1>NMIP</h1>
            <span>National Mineral Intelligence Portal</span>
          </div>
        </div>

        {showProductionRegions ? (
          <ProductionRegionNav
            className="header-region-nav"
            activeRegionId={productionRegionId}
            onRegionChange={onProductionRegionChange}
          />
        ) : (
          <nav className="nav-pills" aria-label="Main navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`nav-pill${activeView === tab.id ? ' active' : ''}`}
                onClick={() => onViewChange(tab.id)}
              >
                <i className={`fa-solid ${tab.icon}`} />
                <span>{tab.label}</span>
                {tab.id === 'mineral-map' && activeView === 'mineral-map' && (
                  <span className="nav-live-dot" aria-hidden="true" />
                )}
              </button>
            ))}
          </nav>
        )}

        <div className="admin-area">
          {showProductionRegions && (
            <nav className="header-view-switch" aria-label="Switch view">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`header-view-btn${activeView === tab.id ? ' active' : ''}`}
                  onClick={() => onViewChange(tab.id)}
                  title={tab.label}
                >
                  <i className={`fa-solid ${tab.icon}`} />
                </button>
              ))}
            </nav>
          )}
          <button type="button" className="header-icon-btn" aria-label="Help">
            <i className="fa-regular fa-circle-question" />
          </button>
          <div className="admin-profile">
            <div className="admin-avatar">
              <i className="fa-solid fa-user" />
            </div>
            <span>Admin</span>
            <i className="fa-solid fa-chevron-down chevron-mini" />
          </div>
        </div>
      </div>
    </header>
  );
}
