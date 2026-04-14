/**
 * StartMe Local Clone - 存储工具模块
 * 封装 Chrome Storage API，提供数据持久化功能
 *
 * 存储策略：
 * - 统一使用 chrome.storage.local 存储
 * - 原因：chrome.storage.sync 有严格配额限制（每项约 8KB），容易导致 quota exceeded 错误
 * - 背景图片单独存储在 local 中
 */

import { Tab, Widget, Task, SearchEngine, Column } from '../types';

// 存储键名常量
const STORAGE_KEY = 'startme_data';
const STORAGE_KEY_BG_IMAGE = 'startme_bg_image';

/**
 * 本地搜索引擎接口（无 icon 字段，便于序列化存储）
 */
interface LocalSearchEngine {
  id: string;
  name: string;
  url: string;
}

/**
 * 存储数据结构接口
 */
interface StorageData {
  tabs: Tab[];
  activeTabId: string;
  searchEngine: string;
  searchEngines: LocalSearchEngine[];
}

/**
 * 默认搜索引擎列表
 */
const DEFAULT_SEARCH_ENGINES: LocalSearchEngine[] = [
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query=' },
];

/**
 * 生成默认标签页结构
 */
const createDefaultTab = (): Tab => ({
  id: 'default-1',
  name: '首页',
  columns: [
    {
      id: 'col-1',
      widgets: [
        {
          id: 'widget-1',
          type: 'tasks',
          title: '任务',
          data: { tasks: [] as Task[] },
        },
      ],
    },
    {
      id: 'col-2',
      widgets: [
        {
          id: 'widget-2',
          type: 'weather',
          title: '天气',
          data: { cities: ['北京'] },
        },
      ],
    },
    { id: 'col-3', widgets: [] },
    { id: 'col-4', widgets: [] },
  ],
  createdAt: Date.now(),
});

export const storage = {
  /**
   * 迁移旧数据格式到新格式
   * - 将旧版 widgets 数组转换为 columns 结构
   * - 为旧书签补充 icon 字段
   * - 迁移背景图片到单独存储
   */
  migrateData(data: any): StorageData {
    // 不再自动生成图标，统一由组件层处理加载和保存
    const addIconsToLinks = (widget: any) => {
      return widget;
    };

    // 已经是新格式（有 columns 字段）
    if (data.tabs && data.tabs[0]?.columns) {
      const processedData = { ...data };

      // 为所有书签补充 icon 字段
      processedData.tabs = data.tabs.map((tab: any) => {
        let tabHasChanges = false;
        const updatedColumns = tab.columns.map((col: any) => {
          let colHasChanges = false;
          const updatedWidgets = col.widgets.map((widget: any) => {
            const newWidget = addIconsToLinks(widget);
            if (newWidget !== widget) {
              colHasChanges = true;
            }
            return newWidget;
          });

          if (colHasChanges) {
            tabHasChanges = true;
            return { ...col, widgets: updatedWidgets };
          }
          return col;
        });

        if (tabHasChanges) {
          return { ...tab, columns: updatedColumns };
        }
        return tab;
      });

      // 迁移旧数据中的背景图片到单独存储
      if (data.bgImage) {
        chrome.storage.local.set({ [STORAGE_KEY_BG_IMAGE]: data.bgImage });
      }

      // 移除 bgImage 字段（现在单独存储）
      const { bgImage, ...result } = processedData;
      return result as StorageData;
    }

    // 旧格式迁移：将 widgets 数组转换为 4 列
    const migratedTabs: Tab[] = (data.tabs || []).map((tab: any) => ({
      ...tab,
      columns: [
        { id: `col-1-${tab.id}`, widgets: [] },
        { id: `col-2-${tab.id}`, widgets: [] },
        { id: `col-3-${tab.id}`, widgets: [] },
        { id: `col-4-${tab.id}`, widgets: [] },
      ],
    }));

    // 将旧 widget 分配到第一列
    if (migratedTabs.length > 0 && data.tabs[0]?.widgets) {
      migratedTabs[0].columns[0].widgets = data.tabs[0].widgets.map((w: any) => ({
        ...w,
        position: undefined, // 移除旧的 position 字段
      }));
    }

    // 迁移旧数据中的背景图片到单独存储
    if (data.bgImage) {
      chrome.storage.local.set({ [STORAGE_KEY_BG_IMAGE]: data.bgImage });
    }

    const result: Omit<StorageData, 'bgImage'> = {
      ...data,
      tabs: migratedTabs,
    };

    // 如果没有标签页，使用默认值
    if (!result.tabs || result.tabs.length === 0) {
      result.tabs = [createDefaultTab()];
    }

    return result;
  },

  /**
   * 获取所有数据
   * 失败时自动降级到 local 存储
   */
  async getData(): Promise<StorageData> {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        // 处理 Chrome API 错误
        if (chrome.runtime.lastError) {
          console.warn('storage.sync 不可用，使用 storage.local', chrome.runtime.lastError.message);
          this.getDataFromLocal().then(resolve);
          return;
        }

        if (result[STORAGE_KEY]) {
          // 迁移数据
          const migrated = this.migrateData(result[STORAGE_KEY]);
          // 如果是旧格式，保存新格式
          if (!result[STORAGE_KEY].tabs?.[0]?.columns) {
            // 异步保存，不阻塞返回
            this.saveData(migrated).catch(err => console.warn('保存迁移数据失败:', err));
          } else {
            // 不再自动更新图标，避免无限循环
            // 新格式数据，检查是否有书签缺少 icon，有则保存
            // const needsIconUpdate = migrated.tabs.some((tab: any) =>
            //   tab.columns.some((col: any) =>
            //     col.widgets.some((w: any) =>
            //       w.type === 'links' && w.data?.links?.some((l: any) => ! !l.icon || l.icon.trim() === '')
            //     )
            //   )
            // );
            // if (needsIconUpdate) {
            //   // 异步保存，不阻塞返回
            //   this.saveData(migrated).catch(err => console.warn('保存图标更新失败:', err));
            // }
          }
          resolve(migrated);
        } else {
          // sync 中没有数据，检查 local 存储
          chrome.storage.local.get([STORAGE_KEY], (localResult) => {
            if (localResult[STORAGE_KEY]) {
              resolve(this.migrateData(localResult[STORAGE_KEY]));
            } else {
              // 返回默认数据
              resolve({
                tabs: [createDefaultTab()],
                activeTabId: 'default-1',
                searchEngine: 'baidu',
                searchEngines: DEFAULT_SEARCH_ENGINES,
              });
            }
          });
        }
      });
    });
  },

  /**
   * 从 local 存储获取数据（sync 失败时的备用方案）
   */
  async getDataFromLocal(): Promise<StorageData> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          const migrated = this.migrateData(result[STORAGE_KEY]);
          // 不再自动更新图标，避免无限循环
          // 检查是否有书签缺少 icon，有则保存
          // const needsIconUpdate = migrated.tabs.some((tab: any) =>
          //   tab.columns.some((col: any) =>
          //     col.widgets.some((w: any) =>
          //       w.type === 'links' && w.data?.links?.some((l: any) => ! !l.icon || l.icon.trim() === '')
          //     )
          //   )
          // );
          // if (needsIconUpdate) {
          //   this.saveData(migrated);
          // }
          resolve(migrated);
        } else {
          resolve({
            tabs: [
              {
                id: 'default-1',
                name: '首页',
                icon: '',
                columns: [
                  { id: 'col-1', widgets: [] },
                  { id: 'col-2', widgets: [] },
                  { id: 'col-3', widgets: [] },
                  { id: 'col-4', widgets: [] },
                ],
                createdAt: Date.now(),
              },
            ],
            activeTabId: 'default-1',
            searchEngine: 'baidu',
            searchEngines: DEFAULT_SEARCH_ENGINES,
          });
        }
      });
    });
  },

  /**
   * 保存数据
   * Chrome Storage API sync 有严格的配额限制：
   * - 单个项目限制约 100KB
   * - 单个数据项限制约 8KB
   *
   * 为了避免 quota exceeded 错误，我们统一使用 storage.local
   */
  async saveData(data: StorageData): Promise<void> {
    return new Promise((resolve) => {
      // 统一使用 local 存储，避免 sync 的配额限制问题
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        if (chrome.runtime.lastError) {
          console.error('保存数据失败:', chrome.runtime.lastError.message);
        }
        resolve();
      });
    });
  },

  /**
   * 获取所有标签页
   */
  async getTabs(): Promise<Tab[]> {
    const data = await this.getData();
    return data.tabs;
  },

  /**
   * 保存标签页列表
   */
  async saveTabs(tabs: Tab[]): Promise<void> {
    // 创建新的 tabs 数组以确保 React 检测到变化
    const newTabs = tabs.map((tab) => ({
      ...tab,
      columns: tab.columns.map((col) => ({
        ...col,
        widgets: col.widgets.map((widget) => ({ ...widget })),
      })),
    }));
    console.log('保存标签页列表:', newTabs.map((t) => ({ id: t.id, name: t.name, widgetCount: t.columns.reduce((sum, col) => sum + col.widgets.length, 0) })));
    const data = await this.getData();
    await this.saveData({ ...data, tabs: newTabs });
    console.log('保存标签页列表完成');
  },

  /**
   * 添加新标签页
   */
  async addTab(tab: Tab): Promise<void> {
    const tabs = await this.getTabs();
    tabs.push(tab);
    await this.saveTabs(tabs);
  },

  /**
   * 更新标签页
   */
  async updateTab(id: string, updates: Partial<Tab>): Promise<void> {
    const tabs = await this.getTabs();
    const index = tabs.findIndex((t) => t.id === id);

    if (index !== -1) {
      tabs[index] = { ...tabs[index], ...updates };
      await this.saveTabs(tabs);
    } else {
      console.warn(`更新标签页失败：未找到 ID 为 ${id} 的标签页`);
    }
  },

  /**
   * 删除标签页
   */
  async deleteTab(id: string): Promise<void> {
    const tabs = await this.getTabs();
    const filteredTabs = tabs.filter((t) => t.id !== id);
    await this.saveTabs(filteredTabs);
  },

  /**
   * 获取激活的标签页 ID
   */
  async getActiveTabId(): Promise<string> {
    const data = await this.getData();
    return data.activeTabId;
  },

  /**
   * 设置激活的标签页 ID
   */
  async setActiveTabId(id: string): Promise<void> {
    const data = await this.getData();
    await this.saveData({ ...data, activeTabId: id });
  },

  /**
   * 获取小组件数据
   */
  async getWidgetData(tabId: string, widgetId: string): Promise<any> {
    const tabs = await this.getTabs();
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab) {
      console.warn(`获取小组件数据失败：未找到标签页 ${tabId}`);
      return null;
    }

    for (const col of tab.columns) {
      const widget = col.widgets.find((w) => w.id === widgetId);
      if (widget) return widget.data || null;
    }

    return null;
  },

  /**
   * 保存小组件数据
   */
  async saveWidgetData(tabId: string, widgetId: string, data: any): Promise<void> {
    const tabs = await this.getTabs();
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab) {
      console.warn(`保存小组件数据失败：未找到标签页 ${tabId}`);
      return;
    }

    for (const col of tab.columns) {
      const widgetIndex = col.widgets.findIndex((w) => w.id === widgetId);
      if (widgetIndex !== -1) {
        // 创建新的 widget 对象以确保 React 检测到变化
        const updatedWidget = { ...col.widgets[widgetIndex], data };
        col.widgets[widgetIndex] = updatedWidget;
        console.log('保存小组件数据:', { widgetId, data });
        await this.saveTabs(tabs);
        return;
      }
    }

    console.warn(`保存小组件数据失败：未找到小组件 ${widgetId}`);
  },

  /**
   * 添加小组件到指定列
   */
  async addWidgetToColumn(tabId: string, columnId: string, widget: Widget): Promise<void> {
    const tabs = await this.getTabs();
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab) {
      console.warn(`添加小组件失败：未找到标签页 ${tabId}`);
      return;
    }

    const column = tab.columns.find((c) => c.id === columnId);
    if (column) {
      column.widgets.push(widget);
      await this.saveTabs(tabs);
    } else {
      console.warn(`添加小组件失败：未找到列 ${columnId}`);
    }
  },

  /**
   * 删除小组件
   */
  async deleteWidget(tabId: string, widgetId: string): Promise<void> {
    const tabs = await this.getTabs();
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab) {
      console.warn(`删除小组件失败：未找到标签页 ${tabId}`);
      return;
    }

    for (const col of tab.columns) {
      const index = col.widgets.findIndex((w) => w.id === widgetId);
      if (index !== -1) {
        col.widgets.splice(index, 1);
        await this.saveTabs(tabs);
        return;
      }
    }

    console.warn(`删除小组件失败：未找到小组件 ${widgetId}`);
  },

  /**
   * 更新小组件
   */
  async updateWidget(tabId: string, widgetId: string, updates: Partial<Widget>): Promise<void> {
    const tabs = await this.getTabs();
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab) {
      console.warn(`更新小组件失败：未找到标签页 ${tabId}`);
      return;
    }

    for (const col of tab.columns) {
      const widget = col.widgets.find((w) => w.id === widgetId);
      if (widget) {
        Object.assign(widget, updates);
        await this.saveTabs(tabs);
        return;
      }
    }

    console.warn(`更新小组件失败：未找到小组件 ${widgetId}`);
  },

  /**
   * 移动小组件到指定位置
   * 支持跨列拖拽和排序
   */
  async moveWidget(
    tabId: string,
    widgetId: string,
    targetColumnId: string,
    targetIndex: number
  ): Promise<void> {
    const tabs = await this.getTabs();
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab) {
      console.warn(`移动小组件失败：未找到标签页 ${tabId}`);
      return;
    }

    // 找到源列和小组件
    let sourceColumn: Column | undefined;
    let widgetIndex = -1;

    for (const col of tab.columns) {
      const idx = col.widgets.findIndex((w) => w.id === widgetId);
      if (idx !== -1) {
        sourceColumn = col;
        widgetIndex = idx;
        break;
      }
    }

    if (sourceColumn && widgetIndex !== -1) {
      // 从源列移除
      const [widget] = sourceColumn.widgets.splice(widgetIndex, 1);

      // 找到目标列并插入
      const targetColumn = tab.columns.find((c) => c.id === targetColumnId);
      if (targetColumn) {
        // 确保索引不越界
        const safeIndex = Math.max(0, Math.min(targetIndex, targetColumn.widgets.length));
        targetColumn.widgets.splice(safeIndex, 0, widget);
        await this.saveTabs(tabs);
      } else {
        // 目标列不存在，放回原列（在原来位置插入）
        console.warn(`移动小组件失败：未找到目标列 ${targetColumnId}，已放回原位`);
        const safeInsertIndex = Math.min(widgetIndex, sourceColumn.widgets.length);
        sourceColumn.widgets.splice(safeInsertIndex, 0, widget);
        await this.saveTabs(tabs);
      }
    } else {
      console.warn(`移动小组件失败：未找到小组件 ${widgetId}`);
    }
  },

  /**
   * 获取背景图片（单独存储在 local 中）
   */
  async getBgImage(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY_BG_IMAGE], (result) => {
        resolve(result[STORAGE_KEY_BG_IMAGE] || '');
      });
    });
  },

  /**
   * 设置背景图片（单独存储在 local 中）
   */
  async setBgImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY_BG_IMAGE]: url }, resolve);
    });
  },

  /**
   * 获取默认搜索引擎
   */
  async getSearchEngine(): Promise<string> {
    const data = await this.getData();
    return data.searchEngine || 'baidu';
  },

  /**
   * 设置默认搜索引擎
   */
  async setSearchEngine(engine: string): Promise<void> {
    const data = await this.getData();
    await this.saveData({ ...data, searchEngine: engine });
  },

  /**
   * 获取搜索引擎列表
   */
  async getSearchEngines(): Promise<SearchEngine[]> {
    const data = await this.getData();
    return data.searchEngines || DEFAULT_SEARCH_ENGINES;
  },

  /**
   * 设置搜索引擎列表
   * 存储时移除 icon 字段（React.ReactNode 无法序列化）
   */
  async setSearchEngines(engines: SearchEngine[]): Promise<void> {
    const data = await this.getData();
    const enginesToStore = engines.map(({ icon, ...rest }) => rest as LocalSearchEngine);
    await this.saveData({ ...data, searchEngines: enginesToStore });
  },
};
