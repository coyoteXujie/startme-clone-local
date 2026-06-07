import React, { useRef, useEffect } from 'react';
import { Tab, TabId } from '../types';
import { Close, Plus } from '@icon-park/react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: TabId;
  showAddTabInput: boolean;
  newTabName: string;
  onTabClick: (id: TabId) => void;
  onAddTab: () => void;
  onDeleteTab: (id: TabId, e: React.MouseEvent) => void;
  onNewTabNameChange: (name: string) => void;
  onConfirmAddTab: () => void;
  onCancelAddTab: () => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  showAddTabInput,
  newTabName,
  onTabClick,
  onAddTab,
  onDeleteTab,
  onNewTabNameChange,
  onConfirmAddTab,
  onCancelAddTab,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddTabInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddTabInput]);

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onTabClick(tab.id)}
        >
          {tab.name}
          {tabs.length > 1 && (
            <button
              className="tab-delete"
              onClick={(e) => onDeleteTab(tab.id, e)}
              title="删除标签页"
            >
              <Close size={14} />
            </button>
          )}
        </div>
      ))}
      {showAddTabInput ? (
        <div className="tab-add-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="tab-add-input"
            placeholder="标签页名称"
            value={newTabName}
            onChange={(e) => onNewTabNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirmAddTab();
              if (e.key === 'Escape') onCancelAddTab();
            }}
            onBlur={() => {
              if (!newTabName.trim()) onCancelAddTab();
            }}
          />
        </div>
      ) : (
        <button className="add-tab-btn" onClick={onAddTab} title="添加标签页">
          <Plus size={16} />
        </button>
      )}
    </div>
  );
};

export default TabBar;
