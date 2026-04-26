import React from 'react';
import { Tab } from '../types';
import { Close } from '@icon-park/react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onAddTab: () => void;
  onDeleteTab: (id: string, e: React.MouseEvent) => void;
}

const TabIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onAddTab,
  onDeleteTab,
}) => {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onTabClick(tab.id)}
        >
          <TabIcon className="tab-icon" /> {tab.name}
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
      <button className="add-tab-btn" onClick={onAddTab} title="添加标签页">
        <TabIcon />
      </button>
    </div>
  );
};

export default TabBar;
