import { Widget, WidgetDataFor, WidgetType } from '../types';
import { createWidgetId } from './id';

const DEFAULT_WIDGET_TITLES: Record<WidgetType, string> = {
  tasks: '任务',
  weather: '天气',
  rss: '新闻源',
  links: '书签',
  pomodoro: '番茄钟',
  notes: '便签',
  devtoolbox: '开发者工具箱',
};

export const getDefaultWidgetTitle = (type: WidgetType): string => DEFAULT_WIDGET_TITLES[type];

/**
 * 新建 widget 时使用的唯一默认数据入口。
 * 新增组件类型时，如果这里没有补默认值，TypeScript 会在构建阶段报错。
 */
export function getDefaultWidgetData<TType extends WidgetType>(type: TType): WidgetDataFor<TType> {
  const dataByType = {
    tasks: { tasks: [] },
    weather: { cities: ['北京'] },
    rss: { feeds: [] },
    links: { links: [], viewMode: 'grid' },
    pomodoro: { timeLeft: 25 * 60, isRunning: false, isBreak: false, cycles: 0, startedAt: null },
    notes: { content: '' },
    devtoolbox: { activeTab: 'json' },
  } satisfies { [T in WidgetType]: WidgetDataFor<T> };

  return dataByType[type];
}

export const createWidget = (type: WidgetType, title: string): Widget => {
  switch (type) {
    case 'tasks':
      return { id: createWidgetId(), type, title, data: getDefaultWidgetData(type) };
    case 'weather':
      return { id: createWidgetId(), type, title, data: getDefaultWidgetData(type) };
    case 'rss':
      return { id: createWidgetId(), type, title, data: getDefaultWidgetData(type) };
    case 'links':
      return { id: createWidgetId(), type, title, data: getDefaultWidgetData(type) };
    case 'pomodoro':
      return { id: createWidgetId(), type, title, data: getDefaultWidgetData(type) };
    case 'notes':
      return { id: createWidgetId(), type, title, data: getDefaultWidgetData(type) };
    case 'devtoolbox':
      return { id: createWidgetId(), type, title, data: getDefaultWidgetData(type) };
    default:
      throw new Error(`Unsupported widget type: ${type}`);
  }
};
