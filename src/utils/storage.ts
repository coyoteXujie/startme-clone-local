/**
 * StartMe Local Clone - 存储工具模块
 * 封装 Chrome Storage API，提供数据持久化功能
 *
 * 存储策略：
 * - 统一使用 chrome.storage.local 存储
 * - 原因：local 容量更适合背景图片、RSS 缓存和多组件数据
 * - 背景图片单独存储在 local 中
 */

import {
  Column,
  SearchEngine,
  StorageData,
  StoredSearchEngine,
  Tab,
  Widget,
  WidgetData,
} from '../types';
import { getDefaultWidgetData } from './widgetDefaults';

// 存储键名常量
const STORAGE_KEY = 'startme_data';
const STORAGE_KEY_BG_IMAGE = 'startme_bg_image';

/**
 * 默认搜索引擎列表
 */
const DEFAULT_SEARCH_ENGINES: StoredSearchEngine[] = [
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
];

type StorageRecord = Record<string, unknown>;

interface StorageAdapter {
  get(keys: string[]): Promise<StorageRecord>;
  set(items: StorageRecord): Promise<void>;
}

const inMemoryStorage = new Map<string, unknown>();

const hasChromeStorage = () => (
  typeof chrome !== 'undefined' &&
  Boolean(chrome.storage?.local)
);

const hasBrowserLocalStorage = () => (
  typeof globalThis.localStorage !== 'undefined'
);

const chromeStorageAdapter: StorageAdapter = {
  get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result);
      });
    });
  },
  set(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  },
};

const localStorageAdapter: StorageAdapter = {
  async get(keys) {
    return keys.reduce<StorageRecord>((result, key) => {
      const raw = globalThis.localStorage.getItem(key);
      if (raw === null) return result;
      try {
        result[key] = JSON.parse(raw);
      } catch {
        result[key] = raw;
      }
      return result;
    }, {});
  },
  async set(items) {
    Object.entries(items).forEach(([key, value]) => {
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    });
  },
};

const memoryStorageAdapter: StorageAdapter = {
  async get(keys) {
    return keys.reduce<StorageRecord>((result, key) => {
      if (inMemoryStorage.has(key)) result[key] = inMemoryStorage.get(key);
      return result;
    }, {});
  },
  async set(items) {
    Object.entries(items).forEach(([key, value]) => inMemoryStorage.set(key, value));
  },
};

const getStorageAdapter = (): StorageAdapter => {
  if (hasChromeStorage()) return chromeStorageAdapter;
  if (hasBrowserLocalStorage()) return localStorageAdapter;
  return memoryStorageAdapter;
};

const readStorageKeys = (keys: string[]): Promise<StorageRecord> => getStorageAdapter().get(keys);
const writeStorageItems = (items: StorageRecord): Promise<void> => getStorageAdapter().set(items);

let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * 串行化所有读改写操作。
 * chrome.storage.local 没有事务能力；两个并发的 get -> set 会互相覆盖旧快照。
 * 通过这个队列保证第二个写入一定读取到第一个写入完成后的最新数据。
 */
const enqueueWrite = <T>(operation: () => Promise<T>): Promise<T> => {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.catch(() => undefined);
  return next;
};

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
          data: getDefaultWidgetData('tasks'),
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
          data: getDefaultWidgetData('weather'),
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

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const normalizeStorageData = (candidate: Partial<StorageData>, defaults = createDefaultData()): StorageData => {
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

/**
 * 迁移旧数据格式到当前格式。
 * 该函数保持纯数据转换，浏览器存储副作用由调用方处理，方便测试和排查导入问题。
 */
export const migrateStorageData = (data: unknown): StorageData => {
  const defaults = createDefaultData();
  if (!isRecord(data)) {
    return defaults;
  }

  const tabsCandidate = Array.isArray(data.tabs) ? data.tabs : [];
  const firstTab = tabsCandidate[0];

  if (isRecord(firstTab) && Array.isArray(firstTab.columns)) {
    const processedData = { ...data } as Partial<StorageData> & { bgImage?: unknown };

    processedData.tabs = tabsCandidate.map((tab) => {
      if (!isRecord(tab) || !Array.isArray(tab.columns)) return tab as Tab;
      return {
        ...tab,
        columns: tab.columns.map((col) => {
          if (!isRecord(col) || !Array.isArray(col.widgets)) return col as Column;
          return {
            ...col,
            widgets: col.widgets.map((widget) => widget as Widget),
          };
        }),
      } as Tab;
    });

    if (processedData.searchEngines) {
      processedData.searchEngines = processedData.searchEngines.filter(
        (engine) => engine.id !== 'sogou'
      );
    }

    if (processedData.searchEngine === 'sogou') {
      processedData.searchEngine = 'baidu';
    }

    const { bgImage, ...result } = processedData;
    void bgImage;
    return normalizeStorageData(result, defaults);
  }

  const migratedTabs: Tab[] = tabsCandidate.map((tab) => {
    const tabRecord = isRecord(tab) ? tab : {};
    const tabId = typeof tabRecord.id === 'string' ? tabRecord.id : `tab-${Date.now()}`;
    return {
      ...(tabRecord as object),
      id: tabId,
      name: typeof tabRecord.name === 'string' ? tabRecord.name : '首页',
      createdAt: typeof tabRecord.createdAt === 'number' ? tabRecord.createdAt : Date.now(),
      columns: [
        { id: `col-1-${tabId}`, widgets: [] },
        { id: `col-2-${tabId}`, widgets: [] },
        { id: `col-3-${tabId}`, widgets: [] },
        { id: `col-4-${tabId}`, widgets: [] },
      ],
    };
  });

  if (migratedTabs.length > 0 && isRecord(firstTab) && Array.isArray(firstTab.widgets)) {
    migratedTabs[0].columns[0].widgets = firstTab.widgets.map((widget) => ({
      ...(isRecord(widget) ? widget : {}),
      position: undefined,
    } as unknown as Widget));
  }

  const legacySearchEngines = Array.isArray(data.searchEngines)
    ? data.searchEngines.filter((engine): engine is StoredSearchEngine => (
      isRecord(engine) &&
      typeof engine.id === 'string' &&
      typeof engine.name === 'string' &&
      typeof engine.url === 'string' &&
      engine.id !== 'sogou'
    ))
    : undefined;

  const result: Partial<StorageData> = {
    ...(data as object),
    tabs: migratedTabs.length > 0 ? migratedTabs : [createDefaultTab()],
    searchEngine: data.searchEngine === 'sogou' ? undefined : data.searchEngine as string | undefined,
    searchEngines: legacySearchEngines,
  };

  return normalizeStorageData(result, defaults);
};

const rawGetData = async (): Promise<StorageData> => {
  const result = await readStorageKeys([STORAGE_KEY]);
  const storedData = result[STORAGE_KEY];

  if (!storedData) return createDefaultData();

  const migrated = migrateStorageData(storedData);
  const storedTabs = isRecord(storedData) && Array.isArray(storedData.tabs) ? storedData.tabs : [];
  const storedFirstTab = storedTabs[0];
  const needsMigrationWrite = isRecord(storedData) && (
    !isRecord(storedFirstTab) ||
    !Array.isArray(storedFirstTab.columns) ||
    Boolean(storedData.bgImage)
  );
  if (needsMigrationWrite && isRecord(storedData)) {
    void enqueueWrite(async () => {
      if (storedData.bgImage) {
        await writeStorageItems({ [STORAGE_KEY_BG_IMAGE]: storedData.bgImage });
      }
      await rawSaveData(migrated);
    }).catch(err => console.warn('保存迁移数据失败:', err));
  }

  return migrated;
};

const rawSaveData = (data: StorageData): Promise<void> => writeStorageItems({ [STORAGE_KEY]: data });

const mutateData = <T>(mutator: (data: StorageData) => { data: StorageData; result: T } | StorageData): Promise<T> => (
  enqueueWrite(async () => {
    const currentData = await rawGetData();
    const mutation = mutator(currentData);
    const nextData = 'data' in mutation ? mutation.data : mutation;
    await rawSaveData(nextData);
    return 'data' in mutation ? mutation.result : undefined as T;
  })
);

export const storage = {
  migrateData: migrateStorageData,

  /**
   * 获取所有数据
   */
  async getData(): Promise<StorageData> {
    await writeQueue.catch(() => undefined);
    return rawGetData();
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
    await enqueueWrite(() => rawSaveData(data));
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
    await mutateData((data) => ({ ...data, tabs: newTabs }));
  },

  /**
   * 添加新标签页
   */
  async addTab(tab: Tab): Promise<void> {
    await mutateData((data) => ({ ...data, tabs: [...data.tabs, tab] }));
  },

  /**
   * 更新标签页
   */
  async updateTab(id: string, updates: Partial<Tab>): Promise<void> {
    await mutateData((data) => {
      const found = data.tabs.some((tab) => tab.id === id);
      if (!found) {
        console.warn(`更新标签页失败：未找到 ID 为 ${id} 的标签页`);
        return data;
      }
      return {
        ...data,
        tabs: data.tabs.map((tab) => tab.id === id ? { ...tab, ...updates } : tab),
      };
    });
  },

  /**
   * 删除标签页
   */
  async deleteTab(id: string): Promise<void> {
    await mutateData((data) => ({
      ...data,
      tabs: data.tabs.filter((tab) => tab.id !== id),
    }));
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
    await mutateData((data) => ({ ...data, activeTabId: id }));
  },

  /**
   * 获取小组件数据
   */
  async getWidgetData(tabId: string, widgetId: string): Promise<WidgetData | null> {
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
  async saveWidgetData(tabId: string, widgetId: string, widgetData: WidgetData): Promise<void> {
    await mutateData((data) => {
      let updated = false;
      const tabs = data.tabs.map((tab) => {
        if (tab.id !== tabId) return tab;
        updated = true;
        return {
          ...tab,
          columns: tab.columns.map((col) => ({
            ...col,
            widgets: col.widgets.map((widget) =>
              widget.id === widgetId ? { ...widget, data: widgetData } as Widget : widget
            ),
          })),
        };
      });

      if (!updated) {
        console.warn(`保存小组件数据失败：未找到标签页 ${tabId}`);
        return data;
      }

      const widgetExists = tabs
        .find((tab) => tab.id === tabId)
        ?.columns.some((col) => col.widgets.some((widget) => widget.id === widgetId));
      if (!widgetExists) {
        console.warn(`保存小组件数据失败：未找到小组件 ${widgetId}`);
        return data;
      }

      return { ...data, tabs };
    });
  },

  /**
   * 添加小组件到指定列
   */
  async addWidgetToColumn(tabId: string, columnId: string, widget: Widget): Promise<void> {
    await mutateData((data) => {
      let tabExists = false;
      let columnExists = false;
      const tabs = data.tabs.map((tab) => {
        if (tab.id !== tabId) return tab;
        tabExists = true;
        return {
          ...tab,
          columns: tab.columns.map((column) => {
            if (column.id !== columnId) return column;
            columnExists = true;
            return { ...column, widgets: [...column.widgets, widget] };
          }),
        };
      });

      if (!tabExists) console.warn(`添加小组件失败：未找到标签页 ${tabId}`);
      else if (!columnExists) console.warn(`添加小组件失败：未找到列 ${columnId}`);

      return tabExists && columnExists ? { ...data, tabs } : data;
    });
  },

  /**
   * 删除小组件
   */
  async deleteWidget(tabId: string, widgetId: string): Promise<void> {
    await mutateData((data) => {
      let tabExists = false;
      let widgetExists = false;
      const tabs = data.tabs.map((tab) => {
        if (tab.id !== tabId) return tab;
        tabExists = true;
        return {
          ...tab,
          columns: tab.columns.map((column) => {
            const widgets = column.widgets.filter((widget) => widget.id !== widgetId);
            if (widgets.length !== column.widgets.length) widgetExists = true;
            return { ...column, widgets };
          }),
        };
      });

      if (!tabExists) console.warn(`删除小组件失败：未找到标签页 ${tabId}`);
      else if (!widgetExists) console.warn(`删除小组件失败：未找到小组件 ${widgetId}`);

      return tabExists && widgetExists ? { ...data, tabs } : data;
    });
  },

  /**
   * 更新小组件
   */
  async updateWidget(tabId: string, widgetId: string, updates: Partial<Omit<Widget, 'type'>> & { data?: WidgetData }): Promise<void> {
    await mutateData((data) => {
      let tabExists = false;
      let widgetExists = false;
      const tabs = data.tabs.map((tab) => {
        if (tab.id !== tabId) return tab;
        tabExists = true;
        return {
          ...tab,
          columns: tab.columns.map((column) => ({
            ...column,
            widgets: column.widgets.map((widget) => {
              if (widget.id !== widgetId) return widget;
              widgetExists = true;
              return { ...widget, ...updates } as Widget;
            }),
          })),
        };
      });

      if (!tabExists) console.warn(`更新小组件失败：未找到标签页 ${tabId}`);
      else if (!widgetExists) console.warn(`更新小组件失败：未找到小组件 ${widgetId}`);

      return tabExists && widgetExists ? { ...data, tabs } : data;
    });
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
    await mutateData((data) => {
      const tab = data.tabs.find((candidate) => candidate.id === tabId);
      if (!tab) {
        console.warn(`移动小组件失败：未找到标签页 ${tabId}`);
        return data;
      }

      let sourceColumnId = '';
      let sourceIndex = -1;
      let movingWidget: Widget | undefined;

      tab.columns.forEach((column) => {
        const index = column.widgets.findIndex((widget) => widget.id === widgetId);
        if (index !== -1) {
          sourceColumnId = column.id;
          sourceIndex = index;
          movingWidget = column.widgets[index];
        }
      });

      if (!movingWidget || sourceIndex === -1) {
        console.warn(`移动小组件失败：未找到小组件 ${widgetId}`);
        return data;
      }

      const targetColumn = tab.columns.find((column) => column.id === targetColumnId);
      if (!targetColumn) {
        console.warn(`移动小组件失败：未找到目标列 ${targetColumnId}`);
        return data;
      }

      const nextColumns = tab.columns.map((column) => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            widgets: column.widgets.filter((widget) => widget.id !== widgetId),
          };
        }
        return column;
      }).map((column) => {
        if (column.id !== targetColumnId || !movingWidget) return column;
        const baseWidgets = column.id === sourceColumnId
          ? column.widgets
          : column.widgets.filter((widget) => widget.id !== widgetId);
        const adjustedIndex = sourceColumnId === targetColumnId && targetIndex > sourceIndex
          ? targetIndex - 1
          : targetIndex;
        const safeIndex = Math.max(0, Math.min(adjustedIndex, baseWidgets.length));
        const widgets = [...baseWidgets];
        widgets.splice(safeIndex, 0, movingWidget);
        return { ...column, widgets };
      });

      return {
        ...data,
        tabs: data.tabs.map((candidate) =>
          candidate.id === tabId ? { ...candidate, columns: nextColumns } : candidate
        ),
      };
    });
  },

  /**
   * 获取背景图片（单独存储在 local 中）
   */
  async getBgImage(): Promise<string | undefined> {
    const result = await readStorageKeys([STORAGE_KEY_BG_IMAGE]);
    return typeof result[STORAGE_KEY_BG_IMAGE] === 'string'
      ? result[STORAGE_KEY_BG_IMAGE]
      : undefined;
  },

  /**
   * 设置背景图片（单独存储在 local 中）
   */
  async setBgImage(url: string): Promise<void> {
    await enqueueWrite(() => writeStorageItems({ [STORAGE_KEY_BG_IMAGE]: url }));
  },

  async getSearchEngine(): Promise<string> {
    const data = await this.getData();
    return data.searchEngine || 'baidu';
  },

  /**
   * 设置默认搜索引擎
   */
  async setSearchEngine(engine: string): Promise<void> {
    await mutateData((data) => ({ ...data, searchEngine: engine }));
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
    const enginesToStore = engines.map(({ icon, ...rest }) => {
      void icon;
      return rest as StoredSearchEngine;
    });
    await mutateData((data) => ({ ...data, searchEngines: enginesToStore }));
  },
};
