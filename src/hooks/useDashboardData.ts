import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import type { WidgetDataChangeHandler } from '../components/WidgetRenderer';
import { EditingLinkState } from '../components/LinkModal';
import { normalizeHttpUrl } from '../utils/url';
import { createWidget, getDefaultWidgetTitle } from '../utils/widgetDefaults';
import { storage } from '../utils/storage';
import { createColumnId, createLinkId, createTabId } from '../utils/id';
import { LinkId, LinkItem, Tab, TabId, Widget, WidgetType, WidgetId, ColumnId } from '../types';

interface UseDashboardDataOptions {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const createBlankColumns = (tabId: TabId) => {
  return [
    { id: createColumnId(tabId, 1), widgets: [] },
    { id: createColumnId(tabId, 2), widgets: [] },
    { id: createColumnId(tabId, 3), widgets: [] },
    { id: createColumnId(tabId, 4), widgets: [] },
  ];
};

const createDefaultTab = (name: string): Tab => {
  const tabId = createTabId();
  return {
    id: tabId,
    name,
    columns: createBlankColumns(tabId),
    createdAt: Date.now(),
  };
};

interface AddWidgetResult {
  ok: boolean;
}

/**
 * 管理仪表盘主数据域：标签页、组件、书签的加载、变更和回滚。
 * 所有会写 storage 的操作集中到这个 hook，App 只剩渲染编排。
 */
export const useDashboardData = ({ onSuccess, onError }: UseDashboardDataOptions) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<TabId>('' as TabId);
  const [showAddTabInput, setShowAddTabInput] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [pendingWidgetType, setPendingWidgetType] = useState<WidgetType | null>(null);
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [activeAddColumnId, setActiveAddColumnId] = useState<ColumnId | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<EditingLinkState | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const findCurrentLinksWidget = useCallback((widgetId: WidgetId, tabId: TabId) => {
    const tab = tabs.find((candidate) => candidate.id === tabId);
    if (!tab) return null;
    return tab.columns
      .flatMap((column) => column.widgets)
      .find((widget) => widget.id === widgetId) || null;
  }, [tabs]);

  const loadData = useCallback(async () => {
    const storedData = await storage.getData();
    const storedTabs = storedData.tabs;
    const storedActiveTabId = storedData.activeTabId;

    setTabs(storedTabs);
    if (storedActiveTabId && storedTabs.find((tab) => tab.id === storedActiveTabId)) {
      setActiveTabId(storedActiveTabId);
      return;
    }

    if (storedTabs.length > 0) {
      const fallbackTabId = storedTabs[0].id;
      setActiveTabId(fallbackTabId);
      storage.setActiveTabId(fallbackTabId).catch((err) => {
        console.error('保存当前标签页失败:', err);
      });
      return;
    }

    const defaultTab = createDefaultTab('首页');
    await storage.addTab(defaultTab);
    setActiveTabId(defaultTab.id);
    await storage.setActiveTabId(defaultTab.id);
    setTabs([defaultTab]);
  }, []);

  const handleSetActiveTab = useCallback((tabId: TabId) => {
    setActiveTabId(tabId);
    storage.setActiveTabId(tabId).catch((err) => {
      console.error('保存当前标签页失败:', err);
      onError('切换标签页失败，请重试');
    });
  }, [onError]);

  const handleAddTab = useCallback(() => {
    setShowAddTabInput(true);
    setNewTabName('');
  }, []);

  const handleCancelAddTab = useCallback(() => {
    setShowAddTabInput(false);
    setNewTabName('');
  }, []);

  const handleConfirmAddTab = useCallback(async () => {
    if (!newTabName.trim()) return;

    const tabId = createTabId();
    const newTab: Tab = {
      id: tabId,
      name: newTabName.trim(),
      columns: createBlankColumns(tabId),
      createdAt: Date.now(),
    };
    const nextTabs = [...tabs, newTab];

    setTabs(nextTabs);
    setActiveTabId(newTab.id);
    setShowAddTabInput(false);
    setNewTabName('');
    onSuccess('已创建标签页');

    (async () => {
      try {
        await storage.addTab(newTab);
        await storage.setActiveTabId(newTab.id);
      } catch (err) {
        console.error('保存标签页失败:', err);
        onError('保存标签页失败，请重试');
        loadData();
      }
    })();
  }, [loadData, newTabName, onError, onSuccess, tabs]);

  const handleDeleteTab = useCallback(async (tabId: TabId, event: MouseEvent) => {
    event.stopPropagation();
    if (tabs.length === 1) {
      onError('至少需要保留一个标签页');
      return;
    }
    if (confirm('确定要删除这个标签页吗？')) {
      const nextTabs = tabs.filter((tab) => tab.id !== tabId);
      const nextActiveTabId = activeTabId === tabId ? nextTabs[0].id : activeTabId;
      const newActiveTabId = activeTabId === tabId ? nextTabs[0].id : activeTabId;

      setTabs(nextTabs);
      if (activeTabId === tabId) {
        setActiveTabId(newActiveTabId);
      }
      onSuccess('标签页已删除');

      (async () => {
        try {
          await storage.deleteTab(tabId);
          await storage.setActiveTabId(nextActiveTabId);
        } catch (err) {
          console.error('删除标签页失败:', err);
          onError('删除标签页失败，请重试');
          loadData();
        }
      })();
    }
  }, [activeTabId, loadData, onError, onSuccess, tabs]);

  const handleStartAddWidget = useCallback((widgetType: WidgetType) => {
    setPendingWidgetType(widgetType);
    setNewWidgetTitle(getDefaultWidgetTitle(widgetType));
  }, []);

  const handleSetActiveAddColumnId = useCallback((columnId: ColumnId | null) => {
    setActiveAddColumnId(columnId);
  }, []);

  const handleCancelAddWidget = useCallback(() => {
    setPendingWidgetType(null);
    setNewWidgetTitle('');
    setActiveAddColumnId(null);
  }, []);

  const handleConfirmAddWidget = useCallback(async (): Promise<AddWidgetResult> => {
    if (!pendingWidgetType) return { ok: false };
    const title = newWidgetTitle.trim() || pendingWidgetType;
    const newWidget = createWidget(pendingWidgetType, title);
    const targetColumnId = activeAddColumnId || activeTab?.columns[0]?.id;

    if (!activeTab || !targetColumnId) {
      onError('没有可用的列来添加小组件');
      return { ok: false };
    }

    try {
      await storage.addWidgetToColumn(activeTabId, targetColumnId, newWidget);
      await loadData();
      onSuccess(`已添加 ${title} 小组件`);
      setActiveAddColumnId(null);
      setPendingWidgetType(null);
      setNewWidgetTitle('');
      return { ok: true };
    } catch (err) {
      console.error('添加小组件失败:', err);
      onError('添加小组件失败，请重试');
      return { ok: false };
    }
  }, [activeAddColumnId, activeTab, activeTabId, loadData, newWidgetTitle, onError, onSuccess, pendingWidgetType]);

  const handleDeleteWidget = useCallback(async (widgetId: WidgetId) => {
    if (!activeTab) return;
    const widget = activeTab.columns
      .flatMap((column) => column.widgets)
      .find((candidate) => candidate.id === widgetId);
    const title = widget?.title || '组件';
    if (!confirm(`确定要删除「${title}」吗？`)) return;

    try {
      await storage.deleteWidget(activeTabId, widgetId);
      await loadData();
      onSuccess(`已删除「${title}」`);
    } catch (err) {
      console.error('删除小组件失败:', err);
      onError('删除小组件失败，请重试');
    }
  }, [activeTab, activeTabId, loadData, onError, onSuccess]);

  const handleToggleWidgetCollapsed = useCallback(async (widgetId: WidgetId) => {
    if (!activeTab) return;

    const currentWidget = activeTab.columns
      .flatMap((column) => column.widgets)
      .find((widget) => widget.id === widgetId);
    if (!currentWidget) return;

    const nextCollapsed = !currentWidget.collapsed;
    const nextTabs = tabs.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        columns: tab.columns.map((column) => ({
          ...column,
          widgets: column.widgets.map((widget) => (
            widget.id === widgetId ? { ...widget, collapsed: nextCollapsed } : widget
          )),
        })),
      };
    });

    setTabs(nextTabs);
    storage.updateWidget(activeTabId, widgetId, { collapsed: nextCollapsed }).catch((err) => {
      console.error('保存折叠状态失败:', err);
      onError('保存折叠状态失败，请重试');
      loadData();
    });
  }, [activeTab, activeTabId, loadData, onError, tabs]);

  const handleWidgetDataChange: WidgetDataChangeHandler = async (currentTabId, widget, data) => {
    try {
      await storage.saveWidgetData(currentTabId, widget.id, data);
      setTabs((prevTabs) => prevTabs.map((tab) => (
        tab.id !== currentTabId
          ? tab
          : {
            ...tab,
            columns: tab.columns.map((column) => ({
              ...column,
              widgets: column.widgets.map((item) =>
                item.id === widget.id ? { ...item, data } as Widget : item
              ),
            })),
          }
      )));
    } catch (err) {
      console.error('保存组件数据失败:', err);
      onError('保存组件数据失败，请重试');
      loadData();
    }
  };

  const handleOpenLinkModal = useCallback((payload: {
    widgetId: WidgetId;
    linkId?: LinkId;
    isEdit: boolean;
    linkData?: LinkItem | null;
  }) => {
    setEditingLink({ widgetId: payload.widgetId, linkId: payload.linkId, isEdit: payload.isEdit });
    setNewLinkName(payload.linkData?.name || '');
    setNewLinkUrl(payload.linkData?.url || '');
    setShowLinkModal(true);
  }, []);

  const closeLinkModal = useCallback(() => {
    setShowLinkModal(false);
    setEditingLink(null);
    setNewLinkName('');
    setNewLinkUrl('');
  }, []);

  const handleSaveLink = useCallback(async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim() || !editingLink) return;

    const widget = findCurrentLinksWidget(editingLink.widgetId, activeTabId);
    if (!widget || widget.type !== 'links') return;

    const normalizedUrl = normalizeHttpUrl(newLinkUrl);
    if (!normalizedUrl) {
      onError('请输入有效的网址');
      return;
    }

    try {
      const links = widget.data.links || [];
      if (editingLink.isEdit && editingLink.linkId) {
        const nextLinks = links.map((link) => (
          link.id === editingLink.linkId
            ? { ...link, name: newLinkName.trim(), url: normalizedUrl }
            : link
        ));
        await storage.updateWidget(activeTabId, widget.id, {
          data: { ...widget.data, links: nextLinks },
        });
        await loadData();
        onSuccess('书签已更新');
      } else {
        const newLink = {
        id: createLinkId(),
        name: newLinkName.trim(),
        url: normalizedUrl,
      };
        await storage.updateWidget(activeTabId, widget.id, {
          data: { ...widget.data, links: [...links, newLink] },
        });
        await loadData();
        onSuccess('书签已添加');
      }
      closeLinkModal();
    } catch (err) {
      console.error('保存书签失败:', err);
      onError('保存书签失败，请重试');
      loadData();
    }
  }, [activeTabId, closeLinkModal, findCurrentLinksWidget, loadData, newLinkName, newLinkUrl, onError, onSuccess]);

  const handleAddBookmark = useCallback(async (widgetId: WidgetId, name: string, url: string) => {
    const widget = findCurrentLinksWidget(widgetId, activeTabId);
    if (!widget || widget.type !== 'links') return;

    const normalizedUrl = normalizeHttpUrl(url);
    if (!normalizedUrl) {
      onError('请输入有效的网址');
      return;
    }

    const newLink = {
      id: createLinkId(),
      name: name.trim(),
      url: normalizedUrl,
    };

    const links = widget.data.links || [];

    setTabs((prevTabs) => prevTabs.map((tab) => (
      tab.id !== activeTabId ? tab : {
        ...tab,
        columns: tab.columns.map((column) => ({
          ...column,
          widgets: column.widgets.map((item) => {
            if (item.id !== widgetId || item.type !== 'links') return item;
            return {
              ...item,
              data: { ...item.data, links: [...(item.data.links || []), newLink] },
            };
          }),
        })),
      }
    )));

    try {
      await storage.updateWidget(activeTabId, widgetId, {
        data: { ...widget.data, links: [...links, newLink] },
      });
      onSuccess('书签已添加');
    } catch (err) {
      console.error('保存书签失败:', err);
      onError('保存书签失败，请重试');
      loadData();
    }
  }, [activeTabId, findCurrentLinksWidget, loadData, onError, onSuccess]);

  return {
    tabs,
    activeTabId,
    activeTab,
    showAddTabInput,
    newTabName,
    pendingWidgetType,
    newWidgetTitle,
    activeAddColumnId,
    showLinkModal,
    editingLink,
    newLinkName,
    newLinkUrl,
    setTabs,
    setActiveTabId,
    setNewTabName,
    setShowAddTabInput,
    setNewWidgetTitle,
    setNewLinkName,
    setNewLinkUrl,
    loadData,
    handleSetActiveTab,
    handleAddTab,
    handleConfirmAddTab,
    handleCancelAddTab,
    handleDeleteTab,
    handleStartAddWidget,
    handleSetActiveAddColumnId,
    handleCancelAddWidget,
    handleConfirmAddWidget,
    handleDeleteWidget,
    handleToggleWidgetCollapsed,
    handleWidgetDataChange,
    handleOpenLinkModal,
    closeLinkModal,
    handleSaveLink,
    handleAddBookmark,
  };
};
