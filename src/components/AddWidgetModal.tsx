import React, { useRef, useEffect } from 'react';
import { Bookmark, Rss, Checklist, Cloudy, Timer, Edit, Code } from '@icon-park/react';

interface AddWidgetModalProps {
  onSelect: (type: 'tasks' | 'weather' | 'rss' | 'links' | 'pomodoro' | 'notes' | 'devtoolbox') => void;
  onClose: () => void;
  pendingWidgetType: string | null;
  newWidgetTitle: string;
  onNewWidgetTitleChange: (title: string) => void;
  onConfirmAddWidget: () => void;
}

const WIDGET_TYPES = [
  { type: 'links' as const, name: '书签', icon: Bookmark },
  { type: 'rss' as const, name: '新闻源 (RSS)', icon: Rss },
  { type: 'tasks' as const, name: '任务', icon: Checklist },
  { type: 'notes' as const, name: '便签', icon: Edit },
  { type: 'devtoolbox' as const, name: '开发者工具箱', icon: Code },
  { type: 'weather' as const, name: '天气', icon: Cloudy },
  { type: 'pomodoro' as const, name: '番茄钟', icon: Timer },
];

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  onSelect,
  onClose,
  pendingWidgetType,
  newWidgetTitle,
  onNewWidgetTitleChange,
  onConfirmAddWidget,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingWidgetType && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [pendingWidgetType]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-add-widget" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{pendingWidgetType ? '设置组件名称' : '添加小组件'}</h3>
        </div>
        <div className="modal-body">
          {pendingWidgetType ? (
            <div className="add-widget-title-form">
              <label className="setting-label">组件标题</label>
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                value={newWidgetTitle}
                onChange={(e) => onNewWidgetTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmAddWidget();
                  if (e.key === 'Escape') onClose();
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="btn-cancel" onClick={onClose}>取消</button>
                <button className="btn-confirm" onClick={onConfirmAddWidget}>确认添加</button>
              </div>
            </div>
          ) : (
            <div className="modal-options">
              {WIDGET_TYPES.map((widget) => (
                <div
                  key={widget.type}
                  className="modal-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(widget.type);
                  }}
                >
                  <widget.icon className="modal-option-icon" size={20} colors={['currentColor', 'currentColor']} />
                  <div className="modal-option-name">{widget.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {!pendingWidgetType && (
          <div className="modal-footer">
            <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWidgetModal;
