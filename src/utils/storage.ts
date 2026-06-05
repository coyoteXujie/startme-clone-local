/**
 * StartMe Local Clone - 存储工具模块
 * 封装 Chrome Storage API，提供数据持久化功能
 *
 * 存储策略：
 * - 统一使用 chrome.storage.local 存储
 * - 原因：local 容量更适合背景图片、RSS 缓存和多组件数据
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

const createDefaultData = (): StorageData => ({
  tabs: [createDefaultTab()],
  activeTabId: 'default-1',
  searchEngine: 'baidu',
  searchEngines: DEFAULT_SEARCH_ENGINES,
});

export const storage = {
  /**
   * 迁移旧数据格式到新格式
   * - 将旧版 widgets 数组转换为 columns 结构
   * - 为旧书签补充 icon 字段
   * - 迁移背景图片到单独存储
   */
  migrateData(data: any): StorageData {
    const defaults = createDefaultData();
    if (!data || typeof data !== 'object') {
      return defaults;
    }

    const normalizeData = (candidate: Partial<StorageData>): StorageData => {
      const tabs = candidate.tabs && candidate.tabs.length > 0 ? candidate.tabs : defaults.tabs;
      const activeTabId = candidate.activeTabId && tabs.some(tab => tab.id === candidate.activeTabId)
        ? candidate.activeTabId
        : tabs[0].id;
      const searchEngines = candidate.searchEngines && candidate.searchEngines.length > 0
        ? candidate.searchEngines
        : defaults.searchEngines;
      const searchEngine = candidate.searchEngine && searchEngines.some(engine => engine.id === candidate.searchEngine)
        ? candidate.searchEngine
        : searchEngines[0].id;

      return {
        tabs,
        activeTabId,
        searchEngine,
        searchEngines,
      };
    };

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

      // 移除搜狗搜索引擎（已废弃）
      if (processedData.searchEngines) {
        processedData.searchEngines = processedData.searchEngines.filter(
          (e: any) => e.id !== 'sogou'
        );
      }

      // 如果当前选中的引擎是搜狗，切换到百度
      if (processedData.searchEngine === 'sogou') {
        processedData.searchEngine = 'baidu';
      }

      // 移除 bgImage 字段（现在单独存储）
      const { bgImage, ...result } = processedData;
      return normalizeData(result as Partial<StorageData>);
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

    const result: Partial<StorageData> = {
      ...data,
      tabs: migratedTabs,
    };

    // 如果没有标签页，使用默认值
    if (!result.tabs || result.tabs.length === 0) {
      result.tabs = [createDefaultTab()];
    }

    return normalizeData(result);
  },

  /**
   * 获取所有数据
   */
  async getData(): Promise<StorageData> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (result[STORAGE_KEY]) {
          const migrated = this.migrateData(result[STORAGE_KEY]);
          if (!result[STORAGE_KEY].tabs?.[0]?.columns || result[STORAGE_KEY].bgImage) {
            this.saveData(migrated).catch(err => console.warn('保存迁移数据失败:', err));
          }
          resolve(migrated);
        } else {
          resolve(createDefaultData());
        }
      });
    });
  },

  /**
   * 兼容旧调用方：当前等同于 getData()
   */
  async getDataFromLocal(): Promise<StorageData> {
    return this.getData();
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
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
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
    const data = await this.getData();
    await this.saveData({ ...data, tabs: newTabs });
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
    let widget: Widget | undefined;

    for (const col of tab.columns) {
      const idx = col.widgets.findIndex((w) => w.id === widgetId);
      if (idx !== -1) {
        sourceColumn = col;
        widgetIndex = idx;
        widget = col.widgets[idx];
        break;
      }
    }

    if (sourceColumn && widgetIndex !== -1 && widget) {
      // 如果是同一个列内移动
      if (sourceColumn.id === targetColumnId) {
        const newWidgets = [...sourceColumn.widgets];
        // 先移除原来的位置
        newWidgets.splice(widgetIndex, 1);
        // 计算正确的目标索引（因为移除了一个元素，如果目标索引大于原来的索引，需要减1）
        const adjustedIndex = targetIndex > widgetIndex ? targetIndex - 1 : targetIndex;
        const safeIndex = Math.max(0, Math.min(adjustedIndex, newWidgets.length));
        // 插入到新位置
        newWidgets.splice(safeIndex, 0, widget);
        sourceColumn.widgets = newWidgets;
        await this.saveTabs(tabs);
        return;
      }

      // 不同列之间移动
      // 从源列移除
      const [removedWidget] = sourceColumn.widgets.splice(widgetIndex, 1);

      // 找到目标列并插入
      const targetColumn = tab.columns.find((c) => c.id === targetColumnId);
      if (targetColumn) {
        // 确保索引不越界
        const safeIndex = Math.max(0, Math.min(targetIndex, targetColumn.widgets.length));
        targetColumn.widgets.splice(safeIndex, 0, removedWidget);
        await this.saveTabs(tabs);
      } else {
        // 目标列不存在，放回原列（在原来位置插入）
        console.warn(`移动小组件失败：未找到目标列 ${targetColumnId}，已放回原位`);
        const safeInsertIndex = Math.min(widgetIndex, sourceColumn.widgets.length);
        sourceColumn.widgets.splice(safeInsertIndex, 0, removedWidget);
        await this.saveTabs(tabs);
      }
    } else {
      console.warn(`移动小组件失败：未找到小组件 ${widgetId}`);
    }
  },

  /**
   * 获取背景图片（单独存储在 local 中）
   */
  async getBgImage(): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([STORAGE_KEY_BG_IMAGE], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result[STORAGE_KEY_BG_IMAGE]);
      });
    });
  },

  /**
   * 设置背景图片（单独存储在 local 中）
   */
  async setBgImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY_BG_IMAGE]: url }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  },

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
    return data.searchEngines?.length ? data.searchEngines : DEFAULT_SEARCH_ENGINES;
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
