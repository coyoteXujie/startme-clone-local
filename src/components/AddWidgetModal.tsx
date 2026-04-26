import React from 'react';
import { Bookmark, Rss, Checklist, Cloudy, Timer } from '@icon-park/react';

interface AddWidgetModalProps {
  onSelect: (type: 'tasks' | 'weather' | 'rss' | 'links' | 'pomodoro') => void;
  onClose: () => void;
}

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ onSelect, onClose }) => {
  const widgets = [
    { type: 'links' as const, name: '书签', icon: Bookmark },
    { type: 'rss' as const, name: '新闻源 (RSS)', icon: Rss },
    { type: 'tasks' as const, name: '任务', icon: Checklist },
    { type: 'weather' as const, name: '天气', icon: Cloudy },
    { type: 'pomodoro' as const, name: '番茄钟', icon: Timer },
  ];

  const handleTypeSelect = (type: string) => {
    onSelect(type as 'tasks' | 'weather' | 'rss' | 'links' | 'pomodoro');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-add-widget" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>添加小组件</h3>
        </div>
        <div className="modal-body">
          <div className="modal-options">
            {widgets.map((widget) => (
              <div
                key={widget.type}
                className="modal-option"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeSelect(widget.type);
                }}
              >
                <widget.icon className="modal-option-icon" size={20} colors={['currentColor', 'currentColor']} />
                <div className="modal-option-name">{widget.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;
