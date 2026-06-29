import { MarkerIcon } from './MarkerIcon';

export default function LayerGroupItem({
  group,
  isOpen,
  isVisible,
  selectedMineralType,
  onToggleDropdown,
  onToggleVisibility,
  onSelectMineral,
}) {
  const hasActiveChild = group.items.some((item) => item.name === selectedMineralType);

  return (
    <div
      className={`layer-group-item${isOpen ? ' open' : ''}${isVisible ? '' : ' dimmed'}${hasActiveChild ? ' has-active-child' : ''}`}
      id={`group-${group.id}`}
    >
      <div className="group-trigger">
        <div className="group-left" onClick={() => onToggleDropdown(group.id)}>
          <i className="fa-solid fa-chevron-down chevron" />
          <MarkerIcon shape={group.marker_style} color={group.marker_color} size={26} />
          <span>{group.name}</span>
        </div>
        <div className="group-right">
          <span className="count-badge">{group.count}</span>
          <button
            type="button"
            className={`visibility-toggle${isVisible ? ' active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(group.id);
            }}
            aria-label={`Toggle ${group.name}`}
          >
            <i className={`fa-regular ${isVisible ? 'fa-eye' : 'fa-eye-slash'}`} />
          </button>
        </div>
      </div>
      <div className="group-dropdown">
        <ul className="sub-item-list">
          {group.items.map((subItem) => (
            <li
              key={subItem.name}
              className={`sub-item${selectedMineralType === subItem.name ? ' active' : ''}`}
              data-mineral={subItem.name}
              onClick={(e) => {
                e.stopPropagation();
                onSelectMineral(subItem.name);
              }}
            >
              <div className="sub-item-left">
                <MarkerIcon shape={group.marker_style} color={group.marker_color} size={20} />
                <span>{subItem.name}</span>
              </div>
              <span className="sub-count">{subItem.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
