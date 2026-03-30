import React from 'react';
import { Tab } from '../types';
import { LayoutGrid, X } from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onAddTab: () => void;
  onDeleteTab: (id: string, e: React.MouseEvent) => void;
}

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
          <LayoutGrid size={16} /> {tab.name}
          {tabs.length > 1 && (
            <button
              className="tab-delete"
              onClick={(e) => onDeleteTab(tab.id, e)}
              title="删除标签页"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button className="add-tab-btn" onClick={onAddTab} title="添加标签页">
        <LayoutGrid size={16} />
      </button>
    </div>
  );
};

export default TabBar;
