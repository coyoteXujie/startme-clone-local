import { ColumnId, DragData, Tab, Widget } from '../types';

interface MoveWidgetInTabsParams {
  tabs: Tab[];
  dragData: DragData;
  targetColumnId: ColumnId;
  targetIndex: number;
}

const clampIndex = (index: number, length: number) => Math.max(0, Math.min(index, length));

/**
 * 纯数据层的 widget 重排算法。
 * DOM 拖拽事件只负责计算 targetIndex，真正的数据变更集中在这里，方便测试跨列和同列排序。
 */
export const moveWidgetInTabs = ({
  tabs,
  dragData,
  targetColumnId,
  targetIndex,
}: MoveWidgetInTabsParams): Tab[] => (
  tabs.map((tab) => {
    if (tab.id !== dragData.tabId) return tab;

    let sourceColumnId = '';
    let sourceWidgets: Widget[] = [];
    let widgetIndex = -1;
    let movingWidget: Widget | undefined;

    for (const column of tab.columns) {
      const index = column.widgets.findIndex((widget) => widget.id === dragData.widgetId);
      if (index !== -1) {
        sourceColumnId = column.id;
        sourceWidgets = column.widgets;
        widgetIndex = index;
        movingWidget = column.widgets[index];
        break;
      }
    }

    if (!movingWidget || widgetIndex === -1 || !tab.columns.some((column) => column.id === targetColumnId)) {
      return tab;
    }

    if (sourceColumnId === targetColumnId) {
      const widgets = [...sourceWidgets];
      widgets.splice(widgetIndex, 1);
      const adjustedIndex = targetIndex > widgetIndex ? targetIndex - 1 : targetIndex;
      widgets.splice(clampIndex(adjustedIndex, widgets.length), 0, movingWidget);

      return {
        ...tab,
        columns: tab.columns.map((column) =>
          column.id === sourceColumnId ? { ...column, widgets } : column
        ),
      };
    }

    return {
      ...tab,
      columns: tab.columns.map((column) => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            widgets: column.widgets.filter((widget) => widget.id !== dragData.widgetId),
          };
        }

        if (column.id === targetColumnId) {
          const widgets = [...column.widgets];
          widgets.splice(clampIndex(targetIndex, widgets.length), 0, movingWidget);
          return { ...column, widgets };
        }

        return column;
      }),
    };
  })
);
