import React from 'react';
import { Delete, Drag } from '@icon-park/react';
import { SearchEngine } from '../types';

interface SearchEngineSettingsModalProps {
  engines: SearchEngine[];
  activeEngineId: string;
  newEngineName: string;
  newEngineUrl: string;
  onClose: () => void;
  onSelectEngine: (engineId: string) => void;
  onDeleteEngine: (engineId: string) => void;
  onNewEngineNameChange: (name: string) => void;
  onNewEngineUrlChange: (url: string) => void;
  onAddEngine: () => void;
}

const SearchEngineSettingsModal: React.FC<SearchEngineSettingsModalProps> = ({
  engines,
  activeEngineId,
  newEngineName,
  newEngineUrl,
  onClose,
  onSelectEngine,
  onDeleteEngine,
  onNewEngineNameChange,
  onNewEngineUrlChange,
  onAddEngine,
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal engine-settings-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-header">
        <h3>搜索设置</h3>
        <button className="modal-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <div className="setting-section">
          <label className="setting-label">默认搜索引擎</label>
          <select
            className="setting-select"
            value={activeEngineId}
            onChange={(event) => onSelectEngine(event.target.value)}
          >
            {engines.map((engine) => (
              <option key={engine.id} value={engine.id}>
                {engine.name}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-section">
          <label className="setting-label">我的搜索引擎</label>
          <div className="engine-list">
            {engines.map((engine) => (
              <div key={engine.id} className="engine-list-item">
                <span className="engine-drag-icon"><Drag size={16} /></span>
                <span className="engine-name">{engine.name}</span>
                <button className="engine-delete-btn" onClick={() => onDeleteEngine(engine.id)}>
                  <Delete size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="setting-section">
          <label className="setting-label">添加搜索引擎</label>
          <div className="add-engine-form">
            <input
              type="text"
              placeholder="名称（如：百度）"
              value={newEngineName}
              onChange={(event) => onNewEngineNameChange(event.target.value)}
              className="add-engine-input"
            />
            <input
              type="text"
              placeholder="搜索 URL（如：https://www.baidu.com/s?wd=）"
              value={newEngineUrl}
              onChange={(event) => onNewEngineUrlChange(event.target.value)}
              className="add-engine-input"
            />
            <button className="add-engine-btn" onClick={onAddEngine}>添加</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SearchEngineSettingsModal;
