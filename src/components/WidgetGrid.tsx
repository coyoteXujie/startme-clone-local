import React from 'react';
import { Close } from '@icon-park/react';
import { ColumnId, Tab, Widget, WidgetId } from '../types';

interface WidgetGridProps {
  activeTab?: Tab;
  dragOverColumn: ColumnId | null;
  dragOverIndex: number | null;
  renderWidget: (widget: Widget, columnId: ColumnId) => React.ReactNode;
  onDragOver: (event: React.DragEvent, columnId: ColumnId) => void;
  onDragLeave: (event: React.DragEvent, columnId: ColumnId) => void;
  onDrop: (event: React.DragEvent, columnId: ColumnId, targetIndex: number) => void;
  onDragStart: (event: React.DragEvent, widgetId: WidgetId, columnId: ColumnId) => void;
  onDragEnd: () => void;
  onDeleteWidget: (widgetId: WidgetId) => void;
  onRequestAddWidget: (columnId: ColumnId) => void;
}

const WidgetGrid: React.FC<WidgetGridProps> = ({
  activeTab,
  dragOverColumn,
  dragOverIndex,
  renderWidget,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onDeleteWidget,
  onRequestAddWidget,
}) => (
  <main className="main-content">
    {activeTab && (
      <div className="columns-grid">
        {activeTab.columns.map((column) => (
          <div
            key={column.id}
            className={`column ${dragOverColumn === column.id ? 'drag-over-column' : ''}`}
            onDragOver={(event) => onDragOver(event, column.id)}
            onDragLeave={(event) => onDragLeave(event, column.id)}
            onDrop={(event) => onDrop(event, column.id, dragOverIndex ?? column.widgets.length)}
          >
            {column.widgets.length === 0 && (
              <button
                className="add-widget-to-column-btn"
                onClick={() => onRequestAddWidget(column.id)}
              >
                + 添加小组件
              </button>
            )}
            <div className="column-widgets">
              {column.widgets.map((widget, widgetIndex) => (
                <div
                  key={widget.id}
                  data-widget-index={widgetIndex}
                  className={`widget-container ${widget.collapsed ? 'collapsed' : ''} ${
                    dragOverColumn === column.id && dragOverIndex === widgetIndex ? 'drag-over' : ''
                  }`}
                  draggable
                  onDragStart={(event) => onDragStart(event, widget.id, column.id)}
                  onDragEnd={onDragEnd}
                >
                  {!widget.collapsed && (
                    <button className="widget-delete-btn" onClick={() => onDeleteWidget(widget.id)}>
                      <Close size={14} />
                    </button>
                  )}
                  {renderWidget(widget, column.id)}
                </div>
              ))}
            </div>
            {column.widgets.length > 0 && (
              <button
                className="add-widget-to-column-btn"
                onClick={() => onRequestAddWidget(column.id)}
              >
                + 添加小组件
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </main>
);

export default WidgetGrid;
