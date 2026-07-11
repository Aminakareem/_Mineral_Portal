import { useEffect, useRef, useState } from 'react';
import { getCategoryMarkerStyle } from '../config/layers';
import { MarkerIcon } from './MarkerIcon';

export default function SearchPanel({ mineralList, categoryMap, getTypeColor, onSelectMineral }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const trimmed = query.toLowerCase().trim();
  const filteredMinerals = mineralList.filter((m) =>
    m.name.toLowerCase().includes(trimmed)
  );

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onSelectMineral(null);
  };

  const handleSelect = (name) => {
    setQuery(name);
    onSelectMineral(name);
    setIsOpen(true);
  };

  return (
    <div
      ref={panelRef}
      className={`search-panel glass-panel${isOpen ? ' open' : ''}`}
      id="search-panel"
    >
      <div className="search-header">
        <div className="search-icon-wrap">
          <i className="fa-solid fa-magnifying-glass" />
        </div>
        <input
          ref={inputRef}
          id="search-input"
          className="search-input"
          placeholder="Search mineral types..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {!isOpen && !query && (
          <kbd className="search-kbd">Ctrl K</kbd>
        )}
        {(query || isOpen) && (
          <button
            id="search-clear"
            type="button"
            className="search-clear-btn"
            title="Clear"
            onClick={handleClear}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-results" id="search-results">
          {filteredMinerals.length === 0 ? (
            <div className="search-empty">
              <i className="fa-regular fa-face-frown" />
              <span>No minerals match &ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            filteredMinerals.slice(0, 12).map((m) => (
              <div
                key={m.name}
                className="search-item"
                data-mineral={m.name}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(m.name);
                }}
              >
                <div className="search-item-left">
                  <MarkerIcon
                    shape={getCategoryMarkerStyle(m.category)}
                    color={getTypeColor(m.name)}
                    size={22}
                  />
                  <div>
                    <div className="label">{m.name}</div>
                    <div className="sub">
                      {categoryMap[m.category]?.name || m.category}
                    </div>
                  </div>
                </div>
                <div className="search-count">{m.count}</div>
              </div>
            ))
          )}
          {filteredMinerals.length > 12 && (
            <div className="search-more">
              +{filteredMinerals.length - 12} more results — refine your search
            </div>
          )}
        </div>
      )}
    </div>
  );
}
