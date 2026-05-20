import React, { useState, useEffect } from 'react';
import { Tab, Widget, DragData, SearchEngine, Column } from './types';
import { storage } from './utils/storage';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import TabBar from './components/TabBar';
import TaskWidget from './components/widgets/TaskWidget';
import WeatherWidget from './components/widgets/WeatherWidget';
import RSSWidget from './components/widgets/RSSWidget';
import LinksWidget from './components/widgets/LinksWidget';
import PomodoroWidget from './components/widgets/PomodoroWidget';
import AddWidgetModal from './components/AddWidgetModal';
import ToastContainer from './components/ToastContainer';
import { Search, Setting, Pic, Close, Plus, MenuFold, Delete, Drag, Download, Upload } from '@icon-park/react';
import defaultBg from './assets/background.jpg';

// 百度图标 - 使用 simple-icons 官方 SVG
const BaiduIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#2932e1">
    <path d="M9.154 0C7.71 0 6.54 1.658 6.54 3.707c0 2.051 1.171 3.71 2.615 3.71 1.446 0 2.614-1.659 2.614-3.71C11.768 1.658 10.6 0 9.154 0zm7.025.594C14.86.58 13.347 2.589 13.2 3.927c-.187 1.745.25 3.487 2.179 3.735 1.933.25 3.175-1.806 3.422-3.364.252-1.555-.995-3.364-2.362-3.674a1.218 1.218 0 0 0-.261-.03zM3.582 5.535a2.811 2.811 0 0 0-.156.008c-2.118.19-2.428 3.24-2.428 3.24-.287 1.41.686 4.425 3.297 3.864 2.617-.561 2.262-3.68 2.183-4.362-.125-1.018-1.292-2.773-2.896-2.75zm16.534 1.753c-2.308 0-2.617 2.119-2.617 3.616 0 1.43.121 3.425 2.988 3.362 2.867-.063 2.553-3.238 2.553-3.988 0-.745-.62-2.99-2.924-2.99zm-8.264 2.478c-1.424.014-2.708.925-3.323 1.947-1.118 1.868-2.863 3.05-3.112 3.363-.25.309-3.61 2.116-2.864 5.42.746 3.301 3.365 3.237 3.365 3.237s1.93.19 4.171-.31c2.24-.495 4.17.123 4.17.123s5.233 1.748 6.665-1.616c1.43-3.364-.808-5.109-.808-5.109s-2.99-2.306-4.736-4.798c-1.072-1.665-2.348-2.268-3.528-2.257zm-2.234 3.84l1.542.024v8.197H7.758c-1.47-.291-2.055-1.292-2.13-1.462-.072-.173-.488-.976-.268-2.343.635-2.049 2.447-2.196 2.447-2.196h1.81zm3.964 2.39v3.881c.096.413.612.488.612.488h1.614v-4.343h1.689v5.782h-3.915c-1.517-.39-1.59-1.465-1.59-1.465v-4.317zm-5.458 1.147c-.66.197-.978.708-1.05.928-.076.22-.247.78-.1 1.269.294 1.095 1.248 1.144 1.248 1.144h1.37v-3.34z"/>
  </svg>
);

// Bing 图标 - 使用微软官方风格
const BingIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#00809d"/>
    <path d="M5 3v18l7-4 7 4V3l-7 4-7-4z" fill="white"/>
  </svg>
);

// Google 图标 - 彩色官方版本
const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// 搜索引擎图标映射
const SEARCH_ENGINE_ICONS: Record<string, React.ReactNode> = {
  baidu: <BaiduIcon size={18} />,
  bing: <BingIcon size={18} />,
  google: <GoogleIcon size={18} />,
};

// 为搜索引擎添加图标
const withIcon = (engine: SearchEngine): SearchEngine => ({
  ...engine,
  icon: SEARCH_ENGINE_ICONS[engine.id] || <Search size={18} colors={['#00809d', '#2932e1']} />,
});

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [bgImage, setBgImage] = useState<string>('');
  const [searchEngine, setSearchEngine] = useState<string>('baidu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>([]);
  const [showEngineSelect, setShowEngineSelect] = useState(false);
  const [showEngineSettings, setShowEngineSettings] = useState(false);
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [importInputRef, setImportInputRef] = useState<HTMLInputElement | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<DragData | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeAddColumnId, setActiveAddColumnId] = useState<string | null>(null);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // 初始化 Toast
  const { toasts, success, error, info, dismissToast } = useToast();

  useEffect(() => {
    loadData();
    loadBgImage();
    loadSearchEngine();
    loadSearchEngines();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-right')) {
        setShowHeaderMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 键盘快捷键
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      action: () => {
        searchInputRef?.focus();
      },
      preventDefault: true,
    },
    {
      key: 'Escape',
      action: () => {
        setShowEngineSelect(false);
        setShowEngineSettings(false);
        setShowHeaderMenu(false);
        setShowAddWidget(false);
      },
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        const newState = !showFocusMode;
        setShowFocusMode(newState);
        info(newState ? '已进入专注模式' : '已退出专注模式');
      },
    },
  ]);

  const loadSearchEngines = async () => {
    const storedEngines = await storage.getSearchEngines();
    setSearchEngines(storedEngines.map((engine) => withIcon(engine as any)));
  };

  const loadSearchEngine = async () => {
    const storedSearchEngine = await storage.getSearchEngine();
    setSearchEngine(storedSearchEngine);
  };

  const loadData = async () => {
    const storedTabs = await storage.getTabs();
    const storedActiveTabId = await storage.getActiveTabId();
    setTabs(storedTabs);
    if (storedActiveTabId && storedTabs.find((t) => t.id === storedActiveTabId)) {
      setActiveTabId(storedActiveTabId);
    } else if (storedTabs.length > 0) {
      setActiveTabId(storedTabs[0].id);
    } else {
      // 如果没有标签页，创建一个默认的
      const defaultTab: Tab = {
        id: `tab-${Date.now()}`,
        name: '首页',
        columns: [
          { id: `col-1-${Date.now()}`, widgets: [] },
          { id: `col-2-${Date.now()}`, widgets: [] },
          { id: `col-3-${Date.now()}`, widgets: [] },
          { id: `col-4-${Date.now()}`, widgets: [] },
        ],
        createdAt: Date.now(),
      };
      await storage.addTab(defaultTab);
      setActiveTabId(defaultTab.id);
      await loadData();
    }
  };

  const loadBgImage = async () => {
    const storedBgImage = await storage.getBgImage();
    if (storedBgImage) {
      setBgImage(storedBgImage);
    } else {
      // 如果没有自定义背景，使用默认背景
      setBgImage(defaultBg);
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleAddTab = async () => {
    const name = prompt('请输入标签页名称:');
    if (!name) return;

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      name,
      columns: [
        { id: `col-1-${Date.now()}`, widgets: [] },
        { id: `col-2-${Date.now()}`, widgets: [] },
        { id: `col-3-${Date.now()}`, widgets: [] },
        { id: `col-4-${Date.now()}`, widgets: [] },
      ],
      createdAt: Date.now(),
    };

    // 本地先更新
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    success(`已创建标签页 "${name}"`);

    // 异步保存
    storage.addTab(newTab).catch(err => {
      console.error('保存标签页失败:', err);
      loadData();
    });
  };

  const handleDeleteTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      error('至少需要保留一个标签页');
      return;
    }
    if (confirm('确定要删除这个标签页吗？')) {
      // 本地先更新
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[0].id);
      }
      success('标签页已删除');

      // 异步保存
      storage.deleteTab(tabId).catch(err => {
        console.error('删除标签页失败:', err);
        loadData();
      });
    }
  };

  const handleAddWidget = async (widgetType: Widget['type']) => {
    const title = prompt('请输入小组件标题:') || widgetType;
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title,
      data: getDefaultWidgetData(widgetType),
    };

    if (activeTab && activeAddColumnId) {
      await storage.addWidgetToColumn(activeTabId, activeAddColumnId, newWidget);
      await loadData();
      success(`已添加 ${title} 小组件`);
    }
    setActiveAddColumnId(null);
    setShowAddWidget(false);
  };

  const getDefaultWidgetData = (type: Widget['type']) => {
    switch (type) {
      case 'tasks':
        return { tasks: [] };
      case 'weather':
        return { cities: ['北京'] };
      case 'rss':
        return { feeds: [] };
      case 'links':
        return { links: [] };
      case 'pomodoro':
        return { timeLeft: 25 * 60, isRunning: false, isBreak: false, cycles: 0 };
      default:
        return {};
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (activeTab) {
      await storage.deleteWidget(activeTabId, widgetId);
      await loadData();
      success('小组件已删除');
    }
  };

  // 处理链接书签的保存（添加/更新）
  const handleSaveLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim() || !editingLink) return;

    if (editingLink.isEdit) {
      // 编辑现有书签
      const widget = activeTab?.columns.flatMap((c) => c.widgets).find((w) => w.id === editingLink.widgetId);
      if (!widget || widget.type !== 'links') return;

      const links = widget.data.links || [];
      const url = newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
      const updatedLinks = links.map((link: any) =>
        link.id === editingLink.linkId
          ? {
              ...link,
              name: newLinkName.trim(),
              url,
            }
          : link
      );

      await storage.updateWidget(activeTabId, widget.id, {
        data: { ...widget.data, links: updatedLinks },
      });
      await loadData();
      success('书签已更新');
    } else {
      // 添加新书签
      const widget = activeTab?.columns.flatMap((c) => c.widgets).find((w) => w.id === editingLink.widgetId);
      if (!widget || widget.type !== 'links') return;

      const links = widget.data.links || [];
      const url = newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
      const newLink = {
        id: `link-${Date.now()}`,
        name: newLinkName.trim(),
        url,
      };

      await storage.updateWidget(activeTabId, widget.id, {
        data: { ...widget.data, links: [...links, newLink] },
      });
      await loadData();
      success('书签已添加');
    }

    setShowLinkModal(false);
    setEditingLink(null);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  // 处理添加书签（直接在组件内表单添加）
  const handleAddBookmark = async (widgetId: string, name: string, url: string) => {
    const widget = activeTab?.columns.flatMap((c) => c.widgets).find((w) => w.id === widgetId);
    if (!widget || widget.type !== 'links') return;

    const links = widget.data.links || [];
    const newLink = {
      id: `link-${Date.now()}`,
      name: name.trim(),
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
    };

    // 先更新本地 state，让 UI 立即响应
    const updatedTabs = tabs.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        columns: tab.columns.map((col) => ({
          ...col,
          widgets: col.widgets.map((w) => {
            if (w.id !== widgetId) return w;
            return {
              ...w,
              data: { ...w.data, links: [...(w.data.links || []), newLink] },
            };
          }),
        })),
      };
    });
    setTabs(updatedTabs);

    // 异步保存到 storage
    await storage.updateWidget(activeTabId, widgetId, {
      data: { ...widget.data, links: [...links, newLink] },
    });
    success('书签已添加');
  };

  // 拖拽处理函数
  const handleDragStart = (e: React.DragEvent, widgetId: string, columnId: string) => {
    const dragData: DragData = {
      widgetId,
      tabId: activeTabId,
      sourceColumnId: columnId,
    };
    setDraggedWidget(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    // 设置拖拽时的半透明效果
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const column = activeTab?.columns.find((c) => c.id === columnId);
    if (!column) return;

    const widgets = column.widgets;
    const columnEl = e.currentTarget as HTMLElement;
    const columnRect = columnEl.getBoundingClientRect();
    const scrollY = columnEl.scrollTop || 0;
    const relativeY = e.clientY - columnRect.top + scrollY;

    // 查找鼠标位置对应的 widget 索引
    let dropIndex = widgets.length;
    for (let i = 0; i < widgets.length; i++) {
      const widgetEl = columnEl.querySelector(`[data-widget-index="${i}"]`);
      if (widgetEl) {
        const widgetRect = widgetEl.getBoundingClientRect();
        const widgetMiddle = widgetRect.top - columnRect.top + widgetRect.height / 2 + scrollY;
        if (relativeY < widgetMiddle) {
          dropIndex = i;
          break;
        }
      }
    }

    setDragOverColumn(columnId);
    setDragOverIndex(dropIndex);
  };

  const handleDragLeave = (e: React.DragEvent, _columnId: string) => {
    e.preventDefault();
    // 只有当鼠标真正离开当前 column 时才清除状态
    // 使用 bounding box 检查鼠标是否还在 column 元素内
    const column = e.currentTarget as HTMLElement;
    const rect = column.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // 如果鼠标还在 column 范围内，不清除状态
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return;
    }

    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string, targetIndex: number) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDragOverIndex(null);

    if (draggedWidget && activeTab) {
      // 先在本地更新状态，避免全量重加载
      const newTabs = tabs.map(tab => {
        if (tab.id !== draggedWidget.tabId) return tab;

        // 找到源列和小组件
        let sourceColumn: Column | undefined;
        let widgetIndex = -1;
        let widget: Widget | undefined;

        for (const col of tab.columns) {
          const idx = col.widgets.findIndex(w => w.id === draggedWidget.widgetId);
          if (idx !== -1) {
            sourceColumn = col;
            widgetIndex = idx;
            widget = col.widgets[idx];
            break;
          }
        }

        if (!sourceColumn || !widget) return tab;

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

          return {
            ...tab,
            columns: tab.columns.map(col => {
              if (col.id === sourceColumn?.id) {
                return { ...col, widgets: newWidgets };
              }
              return col;
            })
          };
        }

        // 不同列之间移动
        // 从源列移除
        const newSourceColumn = {
          ...sourceColumn,
          widgets: sourceColumn.widgets.filter((_: Widget, idx: number) => idx !== widgetIndex)
        };

        // 插入到目标列
        return {
          ...tab,
          columns: tab.columns.map(col => {
            if (col.id === sourceColumn?.id) return newSourceColumn;
            if (col.id === targetColumnId) {
              const safeIndex = Math.max(0, Math.min(targetIndex, col.widgets.length));
              const newWidgets = [...col.widgets];
              newWidgets.splice(safeIndex, 0, widget!);
              return { ...col, widgets: newWidgets };
            }
            return col;
          })
        };
      });

      // 更新本地状态
      setTabs(newTabs);
      setDraggedWidget(null);

      // 异步保存到存储，不阻塞UI
      storage.moveWidget(draggedWidget.tabId, draggedWidget.widgetId, targetColumnId, targetIndex).catch(err => {
        console.error('保存拖拽位置失败:', err);
        // 如果保存失败，重新加载数据恢复正确状态
        loadData();
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleToggleWidgetCollapsed = async (widgetId: string) => {
    if (activeTab) {
      // 本地先更新状态
      const newTabs = tabs.map(tab => {
        if (tab.id !== activeTabId) return tab;
        return {
          ...tab,
          columns: tab.columns.map(col => ({
            ...col,
            widgets: col.widgets.map(widget => {
              if (widget.id === widgetId) {
                return { ...widget, collapsed: !widget.collapsed };
              }
              return widget;
            })
          }))
        };
      });

      setTabs(newTabs);

      // 异步保存
      storage.updateWidget(activeTabId, widgetId, { collapsed: !newTabs.find(t => t.id === activeTabId)?.columns.flatMap(c => c.widgets).find(w => w.id === widgetId)?.collapsed }).catch(err => {
        console.error('保存折叠状态失败:', err);
        loadData();
      });
    }
  };

  const handleSetBgImage = async (url: string) => {
    await storage.setBgImage(url);
    setBgImage(url);
  };

  const handleClearBgImage = async () => {
    await storage.setBgImage('');
    setBgImage('');
    success('背景已清除');
  };

  const handleUploadBgImage = () => {
    fileInputRef?.click();
  };

  const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（限制 2MB）
    if (file.size > 2 * 1024 * 1024) {
      error('图片大小请勿超过 2MB');
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      error('请选择图片文件');
      return;
    }

    // 转换为 base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await handleSetBgImage(base64);
      success('背景图片已设置');
    };
    reader.readAsDataURL(file);

    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  };

  // 导出数据
  const handleExportData = async () => {
    try {
      const data = await storage.getData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `startme-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('数据导出成功');
    } catch (err) {
      console.error('导出失败:', err);
      error('导出失败，请重试');
    }
  };

  // 导入数据
  const handleImportData = () => {
    importInputRef?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      error('请选择 JSON 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // 验证数据格式
        if (!data.tabs || !data.activeTabId) {
          error('无效的数据格式');
          return;
        }
        // 确认导入
        if (confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
          await storage.saveData(data);
          await loadData();
          success('数据导入成功');
        }
      } catch (err) {
        console.error('导入失败:', err);
        error('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);

    // 清空 input
    e.target.value = '';
  };

  const handleSetSearchEngine = async (engine: string) => {
    await storage.setSearchEngine(engine);
    setSearchEngine(engine);
    setShowEngineSelect(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const engine = searchEngines.find((e) => e.id === searchEngine);
    let url = engine?.url || 'https://www.baidu.com/s?wd=';

    // 确保 URL 以 = 结尾，或者包含查询参数
    if (!url.includes('=')) {
      url += '?q=';
    } else if (!url.endsWith('=') && !url.includes('&')) {
      // 如果 URL 包含 = 但不是最后一个字符，可能需要添加查询参数
      url += '&q=';
    }

    window.open(url + encodeURIComponent(searchQuery), '_blank');
    setSearchQuery('');
  };

  const handleAddEngine = async () => {
    if (!newEngineName.trim() || !newEngineUrl.trim()) return;
    const newEngine: SearchEngine = {
      id: `engine-${Date.now()}`,
      name: newEngineName.trim(),
      url: newEngineUrl.trim(),
      icon: (
        <svg viewBox="0 0 100 100" width="18" height="18">
          <circle cx="50" cy="50" r="45" fill="#00809d"/>
          <text x="50" y="65" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial">
            {newEngineName.trim().charAt(0)}
          </text>
        </svg>
      ),
    };
    const updatedEngines = [...searchEngines, newEngine];
    setSearchEngines(updatedEngines);
    await storage.setSearchEngines(updatedEngines);
    setNewEngineName('');
    setNewEngineUrl('');
  };

  const handleDeleteEngine = async (engineId: string) => {
    const updatedEngines = searchEngines.filter((e) => e.id !== engineId);
    setSearchEngines(updatedEngines);
    await storage.setSearchEngines(updatedEngines);
    if (searchEngine === engineId && updatedEngines.length > 0) {
      setSearchEngine(updatedEngines[0].id);
      await storage.setSearchEngine(updatedEngines[0].id);
    }
  };

  const renderWidget = (widget: Widget, columnId: string) => {
    // 捕获当前标签页ID，异步回调时不会因为用户切换标签页而改变
    const currentTabId = activeTabId;
    const props = {
      widget,
      tabId: currentTabId,
      columnId,
      onDataChange: async (data: any) => {
        await storage.saveWidgetData(currentTabId, widget.id, data);
        // 直接更新state，UI立即响应，不需要重新加载全部数据
        setTabs(prevTabs => prevTabs.map(tab => {
          if (tab.id === currentTabId) {
            return {
              ...tab,
              columns: tab.columns.map(col => ({
                ...col,
                widgets: col.widgets.map(w =>
                  w.id === widget.id ? { ...w, data } : w
                )
              }))
            };
          }
          return tab;
        }));
      },
      onDelete: () => handleDeleteWidget(widget.id),
      onToggleCollapsed: () => handleToggleWidgetCollapsed(widget.id),
    };

    switch (widget.type) {
      case 'tasks':
        return <TaskWidget {...props} />;
      case 'weather':
        return <WeatherWidget {...props} />;
      case 'rss':
        return <RSSWidget {...props} />;
      case 'links':
        return <LinksWidget
          {...props}
          onRequestOpenModal={(link, linkData) => {
            if (link?.isEdit && linkData) {
              setEditingLink({ widgetId: props.widget.id, linkId: link.linkId, isEdit: true });
              setNewLinkName(linkData.name);
              setNewLinkUrl(linkData.url);
            } else {
              setEditingLink({ widgetId: props.widget.id, isEdit: false });
              setNewLinkName('');
              setNewLinkUrl('');
            }
            setShowLinkModal(true);
          }}
          onAddBookmark={(widgetId: string, name: string, url: string) => handleAddBookmark(widgetId, name, url)}
        />;
      case 'pomodoro':
        return <PomodoroWidget {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className={`app ${showFocusMode ? 'focus-mode-active' : ''}`} style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}>
      <input
        type="file"
        accept="image/*"
        ref={setFileInputRef}
        onChange={handleBgImageChange}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="application/json"
        ref={setImportInputRef}
        onChange={handleImportFileChange}
        style={{ display: 'none' }}
      />
      <div className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-engine-dropdown">
            <button
              type="button"
              className="engine-select-btn"
              onClick={() => setShowEngineSelect(!showEngineSelect)}
            >
              {searchEngines.find((e) => e.id === searchEngine)?.icon || SEARCH_ENGINE_ICONS.baidu}
            </button>
            {showEngineSelect && (
              <div className="engine-dropdown-menu">
                {searchEngines.map((engine) => (
                  <button
                    key={engine.id}
                    className={`engine-menu-item ${searchEngine === engine.id ? 'active' : ''}`}
                    onClick={() => {
                      handleSetSearchEngine(engine.id);
                      setShowEngineSelect(false);
                    }}
                  >
                    <span className="engine-icon">{engine.icon}</span>
                    <span className="engine-name">{engine.name}</span>
                  </button>
                ))}
                <div className="engine-menu-divider"></div>
                <button
                  className="engine-menu-item settings-item"
                  onClick={() => {
                    setShowEngineSelect(false);
                    setShowEngineSettings(true);
                  }}
                >
                  <Setting className="engine-icon" size={18} colors={['currentColor', 'currentColor']} />
                  <span className="engine-name">搜索设置</span>
                </button>
              </div>
            )}
          </div>
          <input
            ref={setSearchInputRef}
            type="text"
            className="search-input"
            placeholder={searchEngines.find((e) => e.id === searchEngine)?.name || ''}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-icon-btn">
            <Search size={18} colors={['currentColor', 'currentColor']} />
          </button>
        </form>
      </div>

      {/* 搜索引擎设置弹窗 */}
      {showEngineSettings && (
        <div className="modal-overlay" onClick={() => setShowEngineSettings(false)}>
          <div className="modal engine-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>搜索设置</h3>
              <button className="modal-close-btn" onClick={() => setShowEngineSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="setting-section">
                <label className="setting-label">默认搜索引擎</label>
                <select
                  className="setting-select"
                  value={searchEngine}
                  onChange={(e) => handleSetSearchEngine(e.target.value)}
                >
                  {searchEngines.map((engine) => (
                    <option key={engine.id} value={engine.id}>
                      {engine.icon} {engine.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-section">
                <label className="setting-label">我的搜索引擎</label>
                <div className="engine-list">
                  {searchEngines.map((engine) => (
                    <div key={engine.id} className="engine-list-item">
                      <span className="engine-drag-icon"><Drag size={16} /></span>
                      <span className="engine-name">{engine.name}</span>
                      <button className="engine-delete-btn" onClick={() => handleDeleteEngine(engine.id)}>
                        <Delete size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="setting-section">
                <label className="setting-label">添加搜索引擎</label>
                <div className="add-engine-form">
                  <input
                    type="text"
                    placeholder="名称（如：百度）"
                    value={newEngineName}
                    onChange={(e) => setNewEngineName(e.target.value)}
                    className="add-engine-input"
                  />
                  <input
                    type="text"
                    placeholder="搜索 URL（如：https://www.baidu.com/s?wd=）"
                    value={newEngineUrl}
                    onChange={(e) => setNewEngineUrl(e.target.value)}
                    className="add-engine-input"
                  />
                  <button className="add-engine-btn" onClick={handleAddEngine}>添加</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-left">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onAddTab={handleAddTab}
            onDeleteTab={handleDeleteTab}
          />
        </div>
        <div className="header-right">
          <button
            className="menu-toggle-btn"
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
          >
            <MenuFold size={22} />
            <span className="menu-btn-text">菜单</span>
          </button>
          {showHeaderMenu && (
            <div className="header-menu">
              <button
                className="header-menu-item"
                onClick={() => {
                  handleUploadBgImage();
                  setShowHeaderMenu(false);
                }}
              >
                <Pic className="header-menu-icon" size={18} colors={['#00809d', '#2932e1']} />
                <span>选择本地图片</span>
              </button>
              <button
                className="header-menu-item"
                onClick={() => {
                  const url = prompt('输入背景图片 URL:', bgImage || 'https://source.unsplash.com/1920x1080/?nature,landscape');
                  if (url) handleSetBgImage(url);
                  setShowHeaderMenu(false);
                }}
              >
                <Search className="header-menu-icon" size={18} colors={['#00809d', '#2932e1']} />
                <span>输入图片 URL</span>
              </button>
              {bgImage && (
                <button
                  className="header-menu-item"
                  onClick={() => {
                    handleClearBgImage();
                    setShowHeaderMenu(false);
                  }}
                >
                <Close className="header-menu-icon" size={18} colors={['#ef4444', '#f87171']} />
                  <span>清除背景</span>
                </button>
              )}
              <div className="header-menu-divider"></div>
              <button
                className="header-menu-item"
                onClick={() => {
                  handleExportData();
                  setShowHeaderMenu(false);
                }}
              >
                <Download className="header-menu-icon" size={18} colors={['currentColor', 'currentColor']} />
                <span>导出备份数据</span>
              </button>
              <button
                className="header-menu-item"
                onClick={() => {
                  handleImportData();
                  setShowHeaderMenu(false);
                }}
              >
                <Upload className="header-menu-icon" size={18} colors={['currentColor', 'currentColor']} />
                <span>导入备份数据</span>
              </button>
              <div className="header-menu-divider"></div>
              <button
                className="header-menu-item"
                onClick={() => {
                  setShowAddWidget(true);
                  setShowHeaderMenu(false);
                }}
              >
                <Plus className="header-menu-icon" size={18} colors={['currentColor', 'currentColor']} />
                <span>添加小组件</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {activeTab && (
          <div className="columns-grid">
            {activeTab.columns.map((column) => (
              <div
                key={column.id}
                className={`column ${dragOverColumn === column.id ? 'drag-over-column' : ''}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id, dragOverIndex ?? column.widgets.length)}
              >
                {column.widgets.length === 0 && (
                  <button
                    className="add-widget-to-column-btn"
                    onClick={() => {
                      setActiveAddColumnId(column.id);
                      setShowAddWidget(true);
                    }}
                  >
                    + 添加小组件
                  </button>
                )}
                <div className="column-widgets">
                  {column.widgets.map((widget, widgetIndex) => (
                    <div
                      key={widget.id}
                      data-widget-index={widgetIndex}
                      className={`widget-container ${widget.collapsed ? 'collapsed' : ''} ${
                        dragOverColumn === column.id && dragOverIndex === widgetIndex ? 'drag-over' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, widget.id, column.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {!widget.collapsed && (
                        <button className="widget-delete-btn" onClick={() => handleDeleteWidget(widget.id)}>
                          <Close size={14} />
                        </button>
                      )}
                      {renderWidget(widget, column.id)}
                    </div>
                  ))}
                </div>
                {column.widgets.length > 0 && (
                  <button
                    className="add-widget-to-column-btn"
                    onClick={() => {
                      setActiveAddColumnId(column.id);
                      setShowAddWidget(true);
                    }}
                  >
                    + 添加小组件
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddWidget && (
        <AddWidgetModal
          onSelect={handleAddWidget}
          onClose={() => {
            setActiveAddColumnId(null);
            setShowAddWidget(false);
          }}
        />
      )}

      {/* Toast 通知容器 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 链接书签全局弹窗 - 渲染在 App 层级避免堆叠上下文问题 */}
      {showLinkModal && (
        <div
          className="link-modal-overlay"
          onClick={() => {
            setShowLinkModal(false);
            setEditingLink(null);
            setNewLinkName('');
            setNewLinkUrl('');
          }}
        >
          <div
            className="link-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="link-modal-header">
              <h3 className="link-modal-title">
                <span className="link-modal-title-icon">
                  🔖
                </span>
                {editingLink?.isEdit ? '编辑书签' : '添加书签'}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowLinkModal(false);
                  setEditingLink(null);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }}
              >
                <Close size={20} />
              </button>
            </div>
            <div className="link-modal-body">
              <div className="form-group">
                <label>📛 书签名称</label>
                <input
                  type="text"
                  placeholder="例如：百度、GitHub、知乎"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group form-group-last">
                <label>🔗 网址链接</label>
                <input
                  type="text"
                  placeholder="例如：baidu.com 或 https://github.com"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="form-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLink();
                  }}
                />
              </div>
              <p className="link-modal-hint">
                💡 提示：可直接输入域名，无需 https:// 前缀
              </p>
            </div>
            <div className="link-modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowLinkModal(false);
                  setEditingLink(null);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }}
              >
                取消
              </button>
              <button
                className="btn-confirm"
                onClick={handleSaveLink}
              >
                {editingLink?.isEdit ? '💾 保存' : '➕ 添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
