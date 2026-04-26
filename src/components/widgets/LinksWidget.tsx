import { useState, useRef, useEffect, memo } from 'react';
import { Widget, LinkItem } from '../../types';
import { Down, Edit, Plus, Close } from '@icon-park/react';
import { Cloud, LayoutGrid } from 'lucide-react';

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

  const links = widget.data.links || [];
  const viewMode = widget.data.viewMode || 'grid';
  const [failedIcons, setFailedIcons] = useState<Map<string, number>>(new Map());
  const loadingIconsRef = useRef<Map<string, { img: HTMLImageElement; timeoutId: Timeout }>>(new Map());
  const timeoutsRef = useRef<Set<Timeout>>(new Set());

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain;
    } catch {
      return '';
    }
  };

  const getFaviconUrl = (url: string): string => {
    const domain = getDomainFromUrl(url);
    return `https://icon.horse/icon/${domain}`;
  };

  const getFallbackFaviconUrl = (url: string): string => {
    const domain = getDomainFromUrl(url);
    return `https://favicon.im/${domain}`;
  };

  const getDefaultIcon = (name: string, url: string): string => {
    let firstChar = 'L';
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      const cleanDomain = domain.replace(/^www\./, '');
      firstChar = cleanDomain.charAt(0).toUpperCase();
    } catch {
      firstChar = name.trim().charAt(0).toUpperCase() || 'L';
    }

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

  const getDataUrlIcon = (svgString: string): string => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(svgString);
    let binary = '';
    uint8Array.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return 'data:image/svg+xml;base64,' + btoa(binary);
  };

  const handleIconError = (link: LinkItem, img?: HTMLImageElement): boolean => {
    const failCount = failedIcons.get(link.id) || 0;
    if (failCount >= 2) return false;

    const newFailedIcons = new Map(failedIcons);
    newFailedIcons.set(link.id, failCount + 1);
    setFailedIcons(newFailedIcons);

    if (failCount === 0 && img) {
      img.src = getFallbackFaviconUrl(link.url);
      return true;
    }
    return false;
  };

  const handleIconLoad = async (link: LinkItem, img: HTMLImageElement) => {
    const loadingData = loadingIconsRef.current.get(link.id);
    if (loadingData) {
      clearTimeout(loadingData.timeoutId);
      loadingIconsRef.current.delete(link.id);
    }

    const hasAIPortal = link.url.includes('aiportal');
    if (hasAIPortal) {
      handleIconError(link);
      return;
    }

    const updatedLinks = links.map((l: LinkItem) =>
      l.id === link.id ? { ...l, icon: img.src } : l
    );
    await syncData(updatedLinks);
  };

  const startIconTimeout = (link: LinkItem, img: HTMLImageElement) => {
    const timeoutId = setTimeout(() => {
      if (loadingIconsRef.current.has(link.id)) {
        loadingIconsRef.current.delete(link.id);
        handleIconError(link, img);
      }
    }, 5000);

    timeoutsRef.current.add(timeoutId);
    loadingIconsRef.current.set(link.id, { img, timeoutId });
  };

  const handleToggleViewMode = () => {
    const newMode = viewMode === 'cloud' ? 'grid' : 'cloud';
    onDataChange({ links, viewMode: newMode, failedIcons: widget.data.failedIcons || [] });
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const syncData = async (newLinks: LinkItem[]) => {
    const linkIds = new Set(newLinks.map(link => link.id));
    const newFailedIcons = new Map(failedIcons);
    for (const id of newFailedIcons.keys()) {
      if (!linkIds.has(id)) newFailedIcons.delete(id);
    }
    setFailedIcons(newFailedIcons);
    await onDataChange({ links: newLinks, viewMode });
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

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
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
            <Edit size={14} />
          </button>
          <button
            onClick={handleToggleViewMode}
            className="view-mode-toggle"
            title={viewMode === 'grid' ? '切换到云' : '切换到网格'}
          >
            {viewMode === 'grid' ? <Cloud size={16} /> : <LayoutGrid size={16} />}
          </button>
          <Down className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} colors={['currentColor', 'currentColor']} />
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
                    {(failedIcons.get(link.id) || 0) < 2 ? (
                      <img
                        src={link.icon || getFaviconUrl(link.url)}
                        alt=""
                        className="link-icon"
                        loading="lazy"
                        style={{ opacity: link.icon ? 1 : 0, transition: 'opacity 0.2s ease' }}
                        ref={(img) => {
                          if (img && !link.icon) {
                            startIconTimeout(link, img);
                          }
                        }}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const loadingData = loadingIconsRef.current.get(link.id);
                          if (loadingData) {
                            clearTimeout(loadingData.timeoutId);
                            timeoutsRef.current.delete(loadingData.timeoutId);
                            loadingIconsRef.current.delete(link.id);
                          }
                          const triedFallback = handleIconError(link, img);
                          if (!triedFallback) {
                            if (link.icon) {
                              const updatedLinks = links.map((l: LinkItem) =>
                                l.id === link.id ? { ...l, icon: undefined } : l
                              );
                              syncData(updatedLinks);
                            }
                          }
                        }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.opacity = '1';
                          const newFailedIcons = new Map(failedIcons);
                          newFailedIcons.delete(link.id);
                          setFailedIcons(newFailedIcons);
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
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="link-delete"
                        title="删除"
                      >
                        <Close size={14} />
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
              className="add-bookmark-btn"
              onClick={openAddForm}
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
