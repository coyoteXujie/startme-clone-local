import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, CheckOne } from '@icon-park/react';

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
  const [justSaved, setJustSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalContent(val);
    setSaved(false);
    setJustSaved(false);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onDataChange({ content: val });
      setSaved(true);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }, 500);
  }, [onDataChange]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const charCount = localContent.length;
  const lineCount = localContent ? localContent.split('\n').length : 0;

  return (
    <>
      <div className="widget-header">
        <span className="widget-title" onClick={onToggleCollapsed}>
          <Edit size={15} className="widget-title-icon" />
          <span>{widget.title || '便签'}</span>
        </span>
        <div className="widget-header-actions">
          {!saved && <span className="notes-saving">保存中...</span>}
          {justSaved && (
            <span className="notes-saved-flash">
              <CheckOne size={12} />
              已保存
            </span>
          )}
          {saved && !justSaved && localContent && (
            <span className="notes-saved">已保存</span>
          )}
        </div>
      </div>
      {!widget.collapsed && (
        <div className="widget-body">
          <div className="notes-editor">
            <textarea
              className="notes-textarea"
              placeholder="随手记点什么..."
              value={localContent}
              onChange={handleChange}
              spellCheck={false}
            />
            <div className="notes-footer">
              <span className="notes-stats">{charCount} 字 · {lineCount} 行</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotesWidget;
