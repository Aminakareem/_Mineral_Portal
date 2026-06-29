export default function MapControls({
  onHome,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onFullscreen,
  mapReady,
}) {
  const tools = [
    { icon: 'fa-house', label: 'Reset view', action: onHome },
    { icon: 'fa-plus', label: 'Zoom in', action: onZoomIn },
    { icon: 'fa-minus', label: 'Zoom out', action: onZoomOut },
    { sep: true },
    { icon: 'fa-compass', label: 'Reset north', action: onResetNorth },
    { icon: 'fa-expand', label: 'Fullscreen', action: onFullscreen },
  ];

  return (
    <div className="map-controls glass-panel">
      {tools.map((tool, i) =>
        tool.sep ? (
          <div key={`sep-${i}`} className="map-ctrl-sep" />
        ) : (
          <button
            key={tool.icon}
            type="button"
            className="map-ctrl-btn"
            onClick={tool.action}
            disabled={!mapReady}
            title={tool.label}
            aria-label={tool.label}
          >
            <i className={`fa-solid ${tool.icon}`} />
          </button>
        )
      )}
    </div>
  );
}
