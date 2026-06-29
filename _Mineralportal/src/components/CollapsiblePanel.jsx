import { useState } from 'react';

export default function CollapsiblePanel({
  icon,
  iconColor,
  title,
  subtitle,
  defaultOpen = false,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="layer-panel">
      <div
        className="panel-header"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen((prev) => !prev)}
      >
        <i className={icon} style={{ color: iconColor, fontSize: '1.25rem' }} />
        <div className="panel-title" style={{ flex: 1 }}>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        <i className={`fa-solid fa-chevron-down section-chevron${isOpen ? ' open' : ''}`} />
      </div>
      <div className={`collapsible-section${isOpen ? ' open' : ' closed'}`}>{children}</div>
    </div>
  );
}
