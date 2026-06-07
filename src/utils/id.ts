import {
  type ColumnId,
  type LinkId,
  type SearchEngineId,
  type TabId,
  type TaskId,
  type ToastId,
  type WidgetId,
  type RssFeedId,
} from '../types';

const createSuffix = (): string => {
  const now = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `${now.toString(36)}-${random}`;
};

const createId = (prefix: string): string => `${prefix}-${createSuffix()}`;

/**
 * 统一生成域内唯一 ID，便于后续持久化数据追踪。
 */
export const generateId = (prefix = 'item'): string => createId(prefix);

/**
 * 各领域对象 ID 工厂。
 * 不同前缀可让调试时快速定位来源，序列化后仍保持可读。
 */
export const createTabId = (): TabId => createId('tab') as TabId;
export const createColumnId = (tabId: TabId, index: number): ColumnId => `${tabId}-col-${index}` as ColumnId;
export const createWidgetId = (): WidgetId => createId('widget') as WidgetId;
export const createLinkId = (): LinkId => createId('link') as LinkId;
export const createTaskId = (): TaskId => createId('task') as TaskId;
export const createFeedId = (): RssFeedId => createId('rss') as RssFeedId;
export const createEngineId = (): SearchEngineId => createId('engine') as SearchEngineId;
export const createToastId = (): ToastId => createId('toast') as ToastId;

export const castTabId = (value: string): TabId => value as TabId;
