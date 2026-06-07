import React, { useCallback, useState } from 'react';
import { ColumnId, DragData, Tab, TabId, WidgetId } from '../types';
import { storage } from '../utils/storage';
import { moveWidgetInTabs } from '../utils/widgetDrag';

interface UseWidgetDragOptions {
  activeTab?: Tab;
  activeTabId: TabId;
  setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
  reloadData: () => Promise<void>;
  onError: (message: string) => void;
}

/**
 * 管理 widget 拖拽过程中的临时状态和持久化。
 * 排序算法在 utils/widgetDrag 中单独测试，这里只负责 DOM 事件和 storage 写入。
 */
export const useWidgetDrag = ({
  activeTab,
  activeTabId,
  setTabs,
  reloadData,
  onError,
}: UseWidgetDragOptions) => {
  const [draggedWidget, setDraggedWidget] = useState<DragData | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((event: React.DragEvent, widgetId: WidgetId, columnId: ColumnId) => {
    const dragData: DragData = {
      widgetId,
      tabId: activeTabId,
      sourceColumnId: columnId,
    };
    setDraggedWidget(dragData);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.setDragImage(event.currentTarget as HTMLElement, 20, 20);
  }, [activeTabId]);

  const handleDragOver = useCallback((event: React.DragEvent, columnId: ColumnId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const column = activeTab?.columns.find((candidate) => candidate.id === columnId);
    if (!column) return;

    const columnEl = event.currentTarget as HTMLElement;
    const columnRect = columnEl.getBoundingClientRect();
    const scrollY = columnEl.scrollTop || 0;
    const relativeY = event.clientY - columnRect.top + scrollY;

    let dropIndex = column.widgets.length;
    for (let index = 0; index < column.widgets.length; index += 1) {
      const widgetEl = columnEl.querySelector(`[data-widget-index="${index}"]`);
      if (!widgetEl) continue;

      const widgetRect = widgetEl.getBoundingClientRect();
      const widgetMiddle = widgetRect.top - columnRect.top + widgetRect.height / 2 + scrollY;
      if (relativeY < widgetMiddle) {
        dropIndex = index;
        break;
      }
    }

    setDragOverColumn(columnId);
    setDragOverIndex(dropIndex);
  }, [activeTab]);

  const handleDragLeave = useCallback((event: React.DragEvent, _columnId: ColumnId) => {
    event.preventDefault();

    const column = event.currentTarget as HTMLElement;
    const rect = column.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return;
    }

    setDragOverColumn(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent, targetColumnId: ColumnId, targetIndex: number) => {
    event.preventDefault();
    setDragOverColumn(null);
    setDragOverIndex(null);

    if (!draggedWidget || !activeTab) return;

    const dragData = draggedWidget;
    setTabs((currentTabs) => moveWidgetInTabs({
      tabs: currentTabs,
      dragData,
      targetColumnId,
      targetIndex,
    }));
    setDraggedWidget(null);

    storage.moveWidget(dragData.tabId, dragData.widgetId, targetColumnId, targetIndex).catch((err) => {
      console.error('保存拖拽位置失败:', err);
      onError('保存拖拽位置失败，请重试');
      void reloadData();
    });
  }, [activeTab, draggedWidget, onError, reloadData, setTabs]);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  }, []);

  return {
    dragOverColumn,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};
