import React from 'react';
import { ColumnId, LinkId, LinkItem, TabId, Widget, WidgetId } from '../types';
import DevToolboxWidget from './widgets/DevToolboxWidget';
import LinksWidget from './widgets/LinksWidget';
import NotesWidget from './widgets/NotesWidget';
import PomodoroWidget from './widgets/PomodoroWidget';
import RSSWidget from './widgets/RSSWidget';
import TaskWidget from './widgets/TaskWidget';
import WeatherWidget from './widgets/WeatherWidget';

export type WidgetDataChangeHandler = <TWidget extends Widget>(
  tabId: TabId,
  widget: TWidget,
  data: TWidget['data'],
) => Promise<void> | void;

interface WidgetRendererProps {
  widget: Widget;
  tabId: TabId;
  columnId: ColumnId;
  onDataChange: WidgetDataChangeHandler;
  onDeleteWidget: (widgetId: WidgetId) => void;
  onToggleCollapsed: (widgetId: WidgetId) => void;
  onOpenLinkModal: (payload: {
    widgetId: WidgetId;
    linkId?: LinkId;
    isEdit: boolean;
    linkData?: LinkItem | null;
  }) => void;
  onAddBookmark: (widgetId: WidgetId, name: string, url: string) => Promise<void>;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  tabId,
  columnId,
  onDataChange,
  onDeleteWidget,
  onToggleCollapsed,
  onOpenLinkModal,
  onAddBookmark,
}) => {
  const commonProps = {
    tabId,
    columnId,
    onDelete: () => onDeleteWidget(widget.id),
    onToggleCollapsed: () => onToggleCollapsed(widget.id),
  };

  switch (widget.type) {
    case 'tasks':
      return <TaskWidget {...commonProps} widget={widget} onDataChange={(data) => onDataChange(tabId, widget, data)} />;
    case 'weather':
      return <WeatherWidget {...commonProps} widget={widget} onDataChange={(data) => onDataChange(tabId, widget, data)} />;
    case 'rss':
      return <RSSWidget {...commonProps} widget={widget} onDataChange={(data) => onDataChange(tabId, widget, data)} />;
    case 'links':
      return (
        <LinksWidget
          {...commonProps}
          widget={widget}
          onDataChange={(data) => onDataChange(tabId, widget, data)}
          onRequestOpenModal={(link, linkData) => {
            onOpenLinkModal({
              widgetId: widget.id,
              linkId: link.linkId,
              isEdit: link.isEdit,
              linkData,
            });
          }}
          onAddBookmark={onAddBookmark}
        />
      );
    case 'pomodoro':
      return <PomodoroWidget {...commonProps} widget={widget} onDataChange={(data) => onDataChange(tabId, widget, data)} />;
    case 'notes':
      return <NotesWidget {...commonProps} widget={widget} onDataChange={(data) => onDataChange(tabId, widget, data)} />;
    case 'devtoolbox':
      return <DevToolboxWidget {...commonProps} widget={widget} onDataChange={(data) => onDataChange(tabId, widget, data)} />;
  }
};

export default WidgetRenderer;
