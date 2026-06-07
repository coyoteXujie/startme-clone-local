/**
 * StartMe Local Clone - 类型定义模块
 * 定义应用核心数据结构
 */

import React from 'react';

export type Brand<T extends string> = string & { readonly __brand: T };

export type TabId = Brand<'TabId'>;
export type ColumnId = Brand<'ColumnId'>;
export type WidgetId = Brand<'WidgetId'>;
export type LinkId = Brand<'LinkId'>;
export type TaskId = Brand<'TaskId'>;
export type ToastId = Brand<'ToastId'>;
export type SearchEngineId = Brand<'SearchEngineId'>;
export type RssFeedId = Brand<'RssFeedId'>;

/**
 * 小组件类型枚举
 * - rss: RSS 订阅源
 * - tasks: 任务管理
 * - weather: 天气信息
 * - links: 书签链接
 * - pomodoro: 番茄钟
 */
export type WidgetType = 'rss' | 'tasks' | 'weather' | 'links' | 'pomodoro' | 'notes' | 'devtoolbox';

/**
 * RSS 订阅源数据
 */
export interface RSSFeed {
  id: RssFeedId;           // 唯一标识符
  name: string;            // 订阅源名称
  url: string;             // RSS URL
  items: RSSItem[];        // 文章列表
  error?: string;          // 最近一次加载错误
}

/**
 * RSS 文章条目
 */
export interface RSSItem {
  id: string;              // 唯一标识符
  title: string;           // 文章标题
  link: string;            // 文章链接
  pubDate?: string;        // 发布日期
  description?: string;    // 文章描述
}

/**
 * 任务数据
 */
export interface Task {
  id: TaskId;              // 唯一标识符
  title: string;           // 任务标题
  completed: boolean;      // 是否已完成
  createdAt: number;       // 创建时间戳
  completedAt?: number;    // 完成时间戳
}

/**
 * 书签链接数据
 */
export interface LinkItem {
  id: LinkId;              // 唯一标识符
  name: string;            // 书签名称
  url: string;             // 链接 URL
  icon?: string;           // 可选的图标（favicon）
}

export type LinkViewMode = 'grid' | 'cloud';
export type DevToolboxTab = 'json' | 'base64' | 'timestamp';

export interface TasksWidgetData {
  tasks: Task[];
}

export interface WeatherWidgetData {
  cities: string[];
}

export interface RSSWidgetData {
  feeds: RSSFeed[];
}

export interface LinksWidgetData {
  links: LinkItem[];
  viewMode?: LinkViewMode;
  failedIcons?: string[];
}

export interface PomodoroWidgetData {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  cycles: number;
  startedAt?: number | null;
}

export interface NotesWidgetData {
  content: string;
}

export interface DevToolboxWidgetData {
  activeTab: DevToolboxTab;
}

/**
 * 每种 widget 的持久化数据结构。
 * 这是长期维护的核心约束：新增组件时先补这里，业务代码才能获得类型保护。
 */
export interface WidgetDataMap {
  tasks: TasksWidgetData;
  weather: WeatherWidgetData;
  rss: RSSWidgetData;
  links: LinksWidgetData;
  pomodoro: PomodoroWidgetData;
  notes: NotesWidgetData;
  devtoolbox: DevToolboxWidgetData;
}

export type WidgetData = WidgetDataMap[WidgetType];

interface BaseWidget<TType extends WidgetType> {
  id: WidgetId;                  // 唯一标识符
  type: TType;                   // 小组件类型
  title: string;                 // 显示标题
  data: WidgetDataMap[TType];    // 小组件特定数据
  collapsed?: boolean;           // 是否已折叠
}

/**
 * 小组件联合类型。
 * 通过 type 字段区分 data 结构，避免所有组件共享 any 后互相写错数据。
 */
export type Widget = {
  [TType in WidgetType]: BaseWidget<TType>
}[WidgetType];

export type WidgetOfType<TType extends WidgetType> = Extract<Widget, { type: TType }>;
export type WidgetDataFor<TType extends WidgetType> = WidgetDataMap[TType];

/**
 * 列接口
 * 每列包含多个垂直堆叠的小组件
 */
export interface Column {
  id: ColumnId;              // 唯一标识符
  widgets: Widget[];       // 列中的小组件列表
}

/**
 * 标签页接口
 * 每个标签页包含 4 列布局
 */
export interface Tab {
  id: TabId;                 // 唯一标识符
  name: string;            // 标签页名称
  icon?: string;           // 可选的图标
  columns: Column[];       // 4 列布局
  createdAt: number;       // 创建时间戳
}

/**
 * 搜索引擎数据
 */
export interface SearchEngine {
  id: SearchEngineId;       // 唯一标识符
  name: string;            // 引擎名称
  url: string;             // 搜索 URL 模板
  icon?: React.ReactNode;  // 可选的图标（运行时添加）
}

/**
 * 可安全持久化的搜索引擎数据。
 * ReactNode 不能写入 chrome.storage，因此存储层只保存纯数据字段。
 */
export type StoredSearchEngine = Omit<SearchEngine, 'icon'>;

/**
 * chrome.storage/localStorage 中保存的主数据包。
 */
export interface StorageData {
  tabs: Tab[];
  activeTabId: TabId;
  searchEngine: SearchEngineId;
  searchEngines: StoredSearchEngine[];
}

/**
 * 拖拽数据传输接口
 * 用于 HTML5 Drag and Drop API
 */
export interface DragData {
  widgetId: WidgetId;      // 被拖拽的小组件 ID
  tabId: TabId;            // 源标签页 ID
  sourceColumnId: ColumnId; // 源列 ID
}
