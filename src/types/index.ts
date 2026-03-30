/**
 * StartMe Local Clone - 类型定义模块
 * 定义应用核心数据结构
 */

import React from 'react';

/**
 * 小组件类型枚举
 * - rss: RSS 订阅源
 * - tasks: 任务管理
 * - weather: 天气信息
 * - links: 书签链接
 * - pomodoro: 番茄钟
 */
export type WidgetType = 'rss' | 'tasks' | 'weather' | 'links' | 'pomodoro';

/**
 * 小组件基础接口
 * 所有类型的小组件共享此结构
 */
export interface Widget {
  id: string;              // 唯一标识符
  type: WidgetType;        // 小组件类型
  title: string;           // 显示标题
  data: any;               // 小组件特定数据
  collapsed?: boolean;     // 是否已折叠
}

/**
 * 列接口
 * 每列包含多个垂直堆叠的小组件
 */
export interface Column {
  id: string;              // 唯一标识符
  widgets: Widget[];       // 列中的小组件列表
}

/**
 * 标签页接口
 * 每个标签页包含 4 列布局
 */
export interface Tab {
  id: string;              // 唯一标识符
  name: string;            // 标签页名称
  icon?: string;           // 可选的图标
  columns: Column[];       // 4 列布局
  createdAt: number;       // 创建时间戳
}

/**
 * RSS 订阅源数据
 */
export interface RSSFeed {
  id: string;              // 唯一标识符
  name: string;            // 订阅源名称
  url: string;             // RSS URL
  items: RSSItem[];        // 文章列表
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
  id: string;              // 唯一标识符
  title: string;           // 任务标题
  completed: boolean;      // 是否已完成
  createdAt: number;       // 创建时间戳
  completedAt?: number;    // 完成时间戳
}

/**
 * 天气数据
 */
export interface WeatherData {
  city: string;            // 城市名称
  current: WeatherCurrent; // 当前天气
  forecast: WeatherForecast[]; // 天气预报
}

/**
 * 当前天气信息
 */
export interface WeatherCurrent {
  temp: number;            // 温度（摄氏度）
  condition: string;       // 天气状况描述
  icon: string;            // 天气图标
}

/**
 * 天气预报信息
 */
export interface WeatherForecast {
  day: string;             // 日期/星期
  high: number;            // 最高温度
  low: number;             // 最低温度
  condition: string;       // 天气状况
  icon: string;            // 天气图标
}

/**
 * 书签链接数据
 */
export interface LinkItem {
  id: string;              // 唯一标识符
  name: string;            // 书签名称
  url: string;             // 链接 URL
  icon?: string;           // 可选的图标（favicon）
}

/**
 * 搜索引擎数据
 */
export interface SearchEngine {
  id: string;              // 唯一标识符
  name: string;            // 引擎名称
  url: string;             // 搜索 URL 模板
  icon?: React.ReactNode;  // 可选的图标（运行时添加）
}

/**
 * 拖拽数据传输接口
 * 用于 HTML5 Drag and Drop API
 */
export interface DragData {
  widgetId: string;        // 被拖拽的小组件 ID
  tabId: string;           // 源标签页 ID
  sourceColumnId: string;  // 源列 ID
}
