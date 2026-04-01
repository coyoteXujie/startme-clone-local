import React, { useState, useEffect } from 'react';
import { Tab, Widget, DragData, SearchEngine } from './types';
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
import { Search, Settings, Image, X, Plus, MoreVertical, Trash2, GripVertical, Download, Upload, Globe, Compass, Square, Circle } from 'lucide-react';
import defaultBg from './assets/background.jpg';

// 搜索引擎图标映射
const SEARCH_ENGINE_ICONS: Record<string, React.ReactNode> = {
  baidu: (
    <div style={{ position: 'relative', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Circle size={18} fill="#2932e1" color="#2932e1" />
      <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 'bold', color: 'white' }}>百</span>
    </div>
  ),
  bing: (
    <div style={{ position: 'relative', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Square size={18} fill="#00809d" color="#00809d" />
      <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 'bold', color: 'white' }}>B</span>
    </div>
  ),
  google: <Globe size={18} color="#4285f4" />,
  sogou: <Compass size={18} color="#ff6600" />,
};

// 为搜索引擎添加图标
const withIcon = (engine: any): SearchEngine => ({
  ...engine,
  icon: SEARCH_ENGINE_ICONS[engine.id] || <Compass size={18} color="#667eea" />,
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
        setShowFocusMode(prev => !prev);
        info(showFocusMode ? '已退出专注模式' : '已进入专注模式');
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

    await storage.addTab(newTab);
    await loadData();
    setActiveTabId(newTab.id);
    success(`已创建标签页 "${name}"`);
  };

  const handleDeleteTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      error('至少需要保留一个标签页');
      return;
    }
    if (confirm('确定要删除这个标签页吗？')) {
      await storage.deleteTab(tabId);
      await loadData();
      success('标签页已删除');
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

    if (draggedWidget) {
      await storage.moveWidget(draggedWidget.tabId, draggedWidget.widgetId, targetColumnId, targetIndex);
      await loadData();
      setDraggedWidget(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleToggleWidgetCollapsed = async (widgetId: string) => {
    if (activeTab) {
      const widget = activeTab.columns.flatMap((c) => c.widgets).find((w) => w.id === widgetId);
      if (widget) {
        await storage.updateWidget(activeTabId, widgetId, { collapsed: !widget.collapsed });
        await loadData();
      }
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
    const url = engine?.url || 'https://www.baidu.com/s?wd=';
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
          <circle cx="50" cy="50" r="45" fill="#667eea"/>
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

  const renderWidget = (widget: Widget, columnId: string, _widgetIndex: number) => {
    const props = {
      widget,
      tabId: activeTabId,
      columnId,
      onDataChange: async (data: any) => {
        await storage.saveWidgetData(activeTabId, widget.id, data);
        await loadData();
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
              {searchEngines.find((e) => e.id === searchEngine)?.icon}
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
                  <Settings className="engine-icon" size={18} />
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
            <Search size={18} />
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
                      <span className="engine-drag-icon"><GripVertical size={16} /></span>
                      <span className="engine-name">{engine.name}</span>
                      <button className="engine-delete-btn" onClick={() => handleDeleteEngine(engine.id)}>
                        <Trash2 size={16} />
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
            <MoreVertical size={18} />
            <span>菜单</span>
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
                <Image className="header-menu-icon" size={18} />
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
                <Globe className="header-menu-icon" size={18} />
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
                <X className="header-menu-icon" size={18} />
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
                <Download className="header-menu-icon" size={18} />
                <span>导出备份数据</span>
              </button>
              <button
                className="header-menu-item"
                onClick={() => {
                  handleImportData();
                  setShowHeaderMenu(false);
                }}
              >
                <Upload className="header-menu-icon" size={18} />
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
                <Plus className="header-menu-icon" size={18} />
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
                          <X size={14} />
                        </button>
                      )}
                      {renderWidget(widget, column.id, widgetIndex)}
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
          onClick={() => {
            setShowLinkModal(false);
            setEditingLink(null);
            setNewLinkName('');
            setNewLinkUrl('');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              minWidth: '420px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'scaleIn 0.25s ease-out',
              overflow: 'hidden',
            }}
          >
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-gray-200)',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--color-gray-800)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: 'var(--primary-gradient)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                }}>
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
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: 'var(--color-gray-400)',
                  cursor: 'pointer',
                  padding: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-full)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-gray-100)';
                  e.currentTarget.style.color = 'var(--color-gray-600)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'var(--color-gray-400)';
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-gray-700)',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '16px' }}>📛</span> 书签名称
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="例如：百度、GitHub、知乎"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="form-input"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1.5px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--color-gray-50)',
                    color: 'var(--color-gray-800)',
                    outline: 'none',
                    transition: 'all var(--transition-fast)',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-gray-200)';
                    e.currentTarget.style.background = 'var(--color-gray-50)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-gray-700)',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '16px' }}>🔗</span> 网址链接
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="例如：baidu.com 或 https://github.com"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="form-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveLink();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1.5px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--color-gray-50)',
                    color: 'var(--color-gray-800)',
                    outline: 'none',
                    transition: 'all var(--transition-fast)',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-gray-200)';
                    e.currentTarget.style.background = 'var(--color-gray-50)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-gray-500)',
                marginTop: '12px',
                fontStyle: 'italic',
              }}>
                💡 提示：可直接输入域名，无需 https:// 前缀
              </p>
            </div>
            <div className="modal-footer" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--color-gray-200)',
              background: 'var(--color-gray-50)',
            }}>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowLinkModal(false);
                  setEditingLink(null);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }}
                style={{
                  padding: '10px 24px',
                  background: 'var(--color-gray-100)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-gray-600)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-gray-200)';
                  e.currentTarget.style.color = 'var(--color-gray-800)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-gray-100)';
                  e.currentTarget.style.color = 'var(--color-gray-600)';
                }}
              >
                取消
              </button>
              <button
                className="btn-confirm"
                onClick={handleSaveLink}
                style={{
                  padding: '10px 28px',
                  background: 'var(--primary-gradient)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-primary), var(--glow-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-primary)';
                }}
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
