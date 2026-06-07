import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, CheckOne } from '@icon-park/react';
import { ColumnId, TabId, WidgetDataFor, WidgetOfType } from '../../types';

interface NotesWidgetProps {
  widget: WidgetOfType<'notes'>;
  tabId: TabId;
  columnId: ColumnId;
  onDataChange: (data: WidgetDataFor<'notes'>) => Promise<void> | void;
  onDelete: () => void;
  onToggleCollapsed: () => void;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const content = widget.data?.content || '';
  const [localContent, setLocalContent] = useState(content);
  const [saved, setSaved] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingContentRef = useRef<string | null>(null);
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    setLocalContent(content);
    pendingContentRef.current = null;
  }, [content]);

  const saveContent = useCallback((value: string, updateStatus: boolean = true) => {
    return Promise.resolve(onDataChangeRef.current({ content: value }))
      .then(() => {
        if (!updateStatus) return;
        pendingContentRef.current = null;
        setSaved(true);
        setJustSaved(true);
        if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
        savedFlashTimerRef.current = setTimeout(() => setJustSaved(false), 2000);
      })
      .catch(() => {
        if (!updateStatus) return;
        setSaved(false);
        setJustSaved(false);
      });
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalContent(val);
    setSaved(false);
    setJustSaved(false);
    pendingContentRef.current = val;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveContent(val);
    }, 500);
  }, [saveContent]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      if (pendingContentRef.current !== null) {
        void saveContent(pendingContentRef.current, false);
      }
    };
  }, [saveContent]);

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
