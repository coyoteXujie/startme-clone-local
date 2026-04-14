import { useState, useRef, useEffect, memo } from 'react';
import { Widget, LinkItem } from '../../types';
import { ChevronDown, Edit2, Plus, X, Grid, Cloud } from 'lucide-react';

// NodeJS.Timeout 类型别名
type Timeout = ReturnType<typeof setTimeout>;

interface LinksWidgetProps {
  widget: Widget;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onToggleCollapsed: () => void;
  onRequestOpenModal: (link: { linkId?: string; isEdit: boolean }, linkData?: LinkItem | null) => void;
  onAddBookmark?: (widgetId: string, name: string, url: string) => Promise<void>;
}

const LinksWidget: React.FC<LinksWidgetProps> = ({ widget, onDataChange, onToggleCollapsed, onRequestOpenModal, onAddBookmark }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // 直接使用 widget.data，不使用本地 state
  const links = widget.data.links || [];
  const viewMode = widget.data.viewMode || 'grid';
  // failedIcons只保存在本地状态，不持久化避免循环
  const [failedIcons, setFailedIcons] = useState<Set<string>>(new Set());
  // 记录正在检测的图片，用于超时检测
  const loadingIconsRef = useRef<Map<string, { img: HTMLImageElement; timeoutId: Timeout }>>(new Map());
  // 记录待清理的资源
  const timeoutsRef = useRef<Set<Timeout>>(new Set());

  // 从 URL 提取域名
  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain;
    } catch {
      return '';
    }
  };

  // 获取 favicon URL - 使用 Icon.horse 服务（国内可访问，图标更全）
  const getFaviconUrl = (url: string): string => {
    const domain = getDomainFromUrl(url);
    return `https://icon.horse/icon/${domain}`;
  };

  // 生成默认图标（使用域名首字母）- 更清晰易读
  const getDefaultIcon = (name: string, url: string): string => {
    // 优先从URL提取域名首字母
    let firstChar = 'L';
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      // 去掉www.前缀
      const cleanDomain = domain.replace(/^www\./, '');
      firstChar = cleanDomain.charAt(0).toUpperCase();
    } catch {
      // URL解析失败，使用名称首字母
      firstChar = name.trim().charAt(0).toUpperCase() || 'L';
    }

    // 更丰富的颜色 palette，灵感来自 start.me
    const gradients = [
      ['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)'],
      ['rgba(240, 147, 251, 0.9)', 'rgba(245, 86, 158, 0.9)'],
      ['rgba(79, 172, 254, 0.9)', 'rgba(0, 242, 234, 0.9)'],
      ['rgba(67, 233, 123, 0.9)', 'rgba(56, 190, 118, 0.9)'],
      ['rgba(250, 112, 154, 0.9)', 'rgba(254, 191, 119, 0.9)'],
      ['rgba(53, 92, 125, 0.9)', 'rgba(108, 91, 123, 0.9)'],
      ['rgba(255, 118, 117, 0.9)', 'rgba(254, 185, 86, 0.9)'],
      ['rgba(107, 141, 61, 0.9)', 'rgba(53, 102, 82, 0.9)'],
    ];
    const colorIndex = (name + url).length % gradients.length;
    const [color1, color2] = gradients[colorIndex];
    // 最大化字体，占满整个图标区域
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${color2}"/>
        </linearGradient>
      </defs>
      <rect fill="url(#grad${colorIndex})" width="100" height="100" rx="22"/>
      <text x="50" y="68" font-size="80" text-anchor="middle" fill="white" font-weight="900" font-family="Inter, Arial, sans-serif">${firstChar}</text>
    </svg>`;
  };

  // 将 SVG 字符串转换为 Data URL - 使用安全的 Base64 编码
  const getDataUrlIcon = (svgString: string): string => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(svgString);
    let binary = '';
    uint8Array.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return 'data:image/svg+xml;base64,' + btoa(binary);
  };

  // 图标加载失败时的处理 - 仅本地记录，不保存到存储避免循环
  const handleIconError = (link: LinkItem) => {
    if (failedIcons.has(link.id)) return; // 已记录，跳过

    const newFailedIcons = new Set(failedIcons);
    newFailedIcons.add(link.id);
    setFailedIcons(newFailedIcons);
  };

  // 图标加载成功后的处理 - 直接保存URL，不再检测尺寸避免误判
  const handleIconLoad = async (link: LinkItem, img: HTMLImageElement) => {
    // 清除加载记录
    const loadingData = loadingIconsRef.current.get(link.id);
    if (loadingData) {
      clearTimeout(loadingData.timeoutId);
      loadingIconsRef.current.delete(link.id);
    }

    // 排除有问题的特殊站点
    const hasAIPortal = link.url.includes('aiportal');
    if (hasAIPortal) {
      handleIconError(link);
      return;
    }

    // 图标加载成功，将图标URL保存到link对象中，避免下次重新请求
    const updatedLinks = links.map((l: LinkItem) =>
      l.id === link.id ? { ...l, icon: img.src } : l
    );
    await syncData(updatedLinks);
  };

  // 图标加载超时处理 - 5秒内未加载完成视为失败，给足加载时间
  const startIconTimeout = (link: LinkItem, img: HTMLImageElement) => {
    const timeoutId = setTimeout(() => {
      // 如果图片还在加载记录中，说明超时了
      if (loadingIconsRef.current.has(link.id)) {
        loadingIconsRef.current.delete(link.id);
        handleIconError(link);
      }
    }, 5000);

    // 存储超时ID以便清理
    timeoutsRef.current.add(timeoutId);
    loadingIconsRef.current.set(link.id, { img, timeoutId });
  };

  // 切换视图模式
  const handleToggleViewMode = () => {
    const newMode = viewMode === 'cloud' ? 'grid' : 'cloud';
    onDataChange({ links, viewMode: newMode, failedIcons: widget.data.failedIcons || [] });
  };

  // 切换编辑模式
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const syncData = async (newLinks: LinkItem[]) => {
    // 清理不再存在的书签的失败记录 - 使用 Set 优化查找
    const linkIds = new Set(newLinks.map(link => link.id));
    const newFailedIconIds = new Set<string>();
    for (const id of failedIcons) {
      if (linkIds.has(id)) newFailedIconIds.add(id);
    }
    await onDataChange({
      links: newLinks,
      viewMode
    });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (linkId === 'all') {
      await syncData([]);
    } else {
      const updatedLinks = links.filter((link: LinkItem) => link.id !== linkId);
      await syncData(updatedLinks);
    }
  };

  const openEditModal = (link: LinkItem) => {
    onRequestOpenModal({ linkId: link.id, isEdit: true }, link);
  };

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;

    const url = newLinkUrl.trim().startsWith('http')
      ? newLinkUrl.trim()
      : `https://${newLinkUrl.trim()}`;

    if (onAddBookmark) {
      await onAddBookmark(widget.id, newLinkName.trim(), url);
      setNewLinkName('');
      setNewLinkUrl('');
      setShowAddForm(false);
    }
  };

  const openAddForm = () => {
    setShowAddForm(true);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  // 组件卸载时清理所有超时和资源
  useEffect(() => {
    return () => {
      // 清理所有图片加载超时
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
      // 清理加载引用
      loadingIconsRef.current.clear();
    };
  }, []);

  return (
    <div className="links-widget widget-content">
      <h3 className="widget-title" onClick={onToggleCollapsed}>
        <span>{widget.title}</span>
        <div className="widget-title-actions" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={toggleEditMode}
            className={`edit-mode-toggle ${isEditMode ? 'active' : ''}`}
            title={isEditMode ? '退出编辑' : '编辑书签'}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={handleToggleViewMode}
            className="view-mode-toggle"
            title={viewMode === 'grid' ? '切换到云' : '切换到网格'}
          >
            {viewMode === 'grid' ? <Cloud size={16} /> : <Grid size={16} />}
          </button>
          <ChevronDown className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
        </div>
      </h3>

      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">{links.length} 个书签</span>
        </div>
      ) : (
        <>
          <div className={`links-list ${viewMode}`}>
            {links.length === 0 ? (
              <div className="empty-state">暂无书签</div>
            ) : (
              links.map((link: LinkItem) => (
                <div
                  key={link.id}
                  className={`link-item-wrapper ${viewMode} ${isEditMode ? 'editing' : ''}`}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-item"
                  >
                    {!failedIcons.has(link.id) ? (
                      <img
                        src={link.icon || getFaviconUrl(link.url)}
                        alt=""
                        className="link-icon"
                        loading="lazy"
                        style={{ opacity: link.icon ? 1 : 0, transition: 'opacity 0.2s ease' }}
                        ref={(img) => {
                          if (img && !link.icon) {
                            // 只有当没有保存的icon时才需要检测和超时
                            startIconTimeout(link, img);
                          }
                        }}
                        onError={() => {
                          const loadingData = loadingIconsRef.current.get(link.id);
                          if (loadingData) {
                            clearTimeout(loadingData.timeoutId);
                            timeoutsRef.current.delete(loadingData.timeoutId);
                            loadingIconsRef.current.delete(link.id);
                          }
                          handleIconError(link);
                          // 如果已有icon但加载失败，清除无效icon，下次重新加载
                          if (link.icon) {
                            const updatedLinks = links.map((l: LinkItem) =>
                              l.id === link.id ? { ...l, icon: undefined } : l
                            );
                            syncData(updatedLinks);
                          }
                        }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          // 加载完成后显示图标
                          img.style.opacity = '1';
                          // 每次加载成功都保存icon，确保最新
                          handleIconLoad(link, img);
                        }}
                      />
                    ) : (
                      <img
                        src={getDataUrlIcon(getDefaultIcon(link.name, link.url))}
                        alt=""
                        className="link-icon"
                      />
                    )}
                    <span className="link-name">{link.name}</span>
                  </a>
                  {isEditMode && (
                    <div className="link-actions">
                      <button
                        onClick={() => openEditModal(link)}
                        className="link-edit"
                        title="编辑"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="link-delete"
                        title="删除"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {showAddForm ? (
            <div className="add-rss-form" style={{ marginTop: '12px' }}>
              <input
                type="text"
                placeholder="📛 书签名称"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="🔗 网址链接 (例如：baidu.com)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
              />
              <button onClick={handleAddLink}>➕ 添加</button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }}
                type="button"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={openAddForm}
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-primary)',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-gradient)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Plus size={16} />
              添加书签
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default memo(LinksWidget);
