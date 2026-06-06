import React from 'react';
import { Search, Setting } from '@icon-park/react';
import { SearchEngine } from '../types';
import { SEARCH_ENGINE_ICONS } from './SearchEngineIcons';

interface SearchBarProps {
  engines: SearchEngine[];
  activeEngineId: string;
  query: string;
  showEngineSelect: boolean;
  inputRef: (node: HTMLInputElement | null) => void;
  onSubmit: (event: React.FormEvent) => void;
  onQueryChange: (query: string) => void;
  onToggleEngineSelect: () => void;
  onSelectEngine: (engineId: string) => void;
  onOpenSettings: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  engines,
  activeEngineId,
  query,
  showEngineSelect,
  inputRef,
  onSubmit,
  onQueryChange,
  onToggleEngineSelect,
  onSelectEngine,
  onOpenSettings,
}) => {
  const activeEngine = engines.find((engine) => engine.id === activeEngineId);

  return (
    <div className="search-section">
      <form className="search-form" onSubmit={onSubmit}>
        <div className="search-engine-dropdown">
          <button
            type="button"
            className="engine-select-btn"
            onClick={onToggleEngineSelect}
          >
            {activeEngine?.icon || SEARCH_ENGINE_ICONS.baidu}
          </button>
          {showEngineSelect && (
            <div className="engine-dropdown-menu">
              {engines.map((engine) => (
                <button
                  type="button"
                  key={engine.id}
                  className={`engine-menu-item ${activeEngineId === engine.id ? 'active' : ''}`}
                  onClick={() => onSelectEngine(engine.id)}
                >
                  <span className="engine-icon">{engine.icon}</span>
                  <span className="engine-name">{engine.name}</span>
                </button>
              ))}
              <div className="engine-menu-divider" />
              <button
                type="button"
                className="engine-menu-item settings-item"
                onClick={onOpenSettings}
              >
                <Setting className="engine-icon" size={18} colors={['currentColor', 'currentColor']} />
                <span className="engine-name">搜索设置</span>
              </button>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={activeEngine?.name || ''}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button type="submit" className="search-icon-btn">
          <Search size={18} colors={['currentColor', 'currentColor']} />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
