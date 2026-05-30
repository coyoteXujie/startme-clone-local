import React, { useState, useEffect, useRef, useCallback } from 'react';

interface NotesWidgetProps {
  widget: any;
  tabId: string;
  onDataChange: (data: any) => void;
  onDelete: () => void;
  onToggleCollapsed: () => void;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const content = widget.data?.content || '';
  const [localContent, setLocalContent] = useState(content);
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalContent(val);
    setSaved(false);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onDataChange({ content: val });
      setSaved(true);
    }, 500);
  }, [onDataChange]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <>
      <div className="widget-header">
        <span className="widget-title" onClick={onToggleCollapsed}>
          {widget.title || '便签'}
        </span>
        <div className="widget-header-actions">
          {!saved && <span className="notes-saving">保存中...</span>}
          {saved && localContent && <span className="notes-saved">已保存</span>}
        </div>
      </div>
      {!widget.collapsed && (
        <div className="widget-body">
          <textarea
            className="notes-textarea"
            placeholder="随手记点什么..."
            value={localContent}
            onChange={handleChange}
            spellCheck={false}
          />
        </div>
      )}
    </>
  );
};

export default NotesWidget;
