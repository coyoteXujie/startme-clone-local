import React from 'react';
import { LinkItem, Widget } from '../types';
import DevToolboxWidget from './widgets/DevToolboxWidget';
import LinksWidget from './widgets/LinksWidget';
import NotesWidget from './widgets/NotesWidget';
import PomodoroWidget from './widgets/PomodoroWidget';
import RSSWidget from './widgets/RSSWidget';
import TaskWidget from './widgets/TaskWidget';
import WeatherWidget from './widgets/WeatherWidget';

export type WidgetDataChangeHandler = <TWidget extends Widget>(
  tabId: string,
  widget: TWidget,
  data: TWidget['data'],
) => Promise<void> | void;

interface WidgetRendererProps {
  widget: Widget;
  tabId: string;
  columnId: string;
  onDataChange: WidgetDataChangeHandler;
  onDeleteWidget: (widgetId: string) => void;
  onToggleCollapsed: (widgetId: string) => void;
  onOpenLinkModal: (payload: {
    widgetId: string;
    linkId?: string;
    isEdit: boolean;
    linkData?: LinkItem | null;
  }) => void;
  onAddBookmark: (widgetId: string, name: string, url: string) => Promise<void>;
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
