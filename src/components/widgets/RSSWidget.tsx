import React, { useState, useRef, useEffect } from 'react';
import { Widget, RSSFeed, RSSItem } from '../../types';
import { Down, Refresh, Delete, Plus } from '@icon-park/react';

interface RSSWidgetProps {
  widget: Widget;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onToggleCollapsed: () => void;
}

const RSSWidget: React.FC<RSSWidgetProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const [feeds, setFeeds] = useState<RSSFeed[]>(widget.data.feeds || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [loadingFeeds, setLoadingFeeds] = useState<Set<string>>(new Set());
  const [feedPages, setFeedPages] = useState<Record<string, number>>({});
  const [activeFeedId, setActiveFeedId] = useState<string | null>(feeds[0]?.id || null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handlePageChange = (feedId: string, delta: number) => {
    setFeedPages(prev => ({
      ...prev,
      [feedId]: Math.max(0, (prev[feedId] || 0) + delta),
    }));
  };

  const handleAddFeed = async () => {
    if (!newFeedName.trim() || !newFeedUrl.trim()) return;

    const feedId = `rss-${Date.now()}`;
    const newFeed: RSSFeed = {
      id: feedId,
      name: newFeedName.trim(),
      url: newFeedUrl.trim(),
      items: [],
    };

    const updatedFeeds = [...feeds, newFeed];
    setFeeds(updatedFeeds);
    setActiveFeedId(feedId);
    setLoadingFeeds(prev => new Set(prev).add(feedId));
    await onDataChange({ feeds: updatedFeeds });
    setNewFeedName('');
    setNewFeedUrl('');
    setShowAddForm(false);

    loadRSSFeed(feedId, newFeedUrl.trim());
  };

  const loadRSSFeed = async (feedId: string, url: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
        { signal: controller.signal }
      );
      const data = await response.json();

      if (data.status === 'ok') {
        const allItems = data.items.map((item: any) => ({
          id: item.guid || item.link,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.description?.substring(0, 200) || '',
        } as RSSItem));

        const updatedFeeds = feeds.map((feed) =>
          feed.id === feedId ? { ...feed, items: allItems } : feed
        );
        setFeeds(updatedFeeds);
        setFeedPages(prev => ({ ...prev, [feedId]: 0 }));
        onDataChange({ feeds: updatedFeeds });
      } else {
        const updatedFeeds = feeds.map((feed) =>
          feed.id === feedId ? { ...feed, items: [], error: data.message || '解析失败' } : feed
        );
        setFeeds(updatedFeeds);
        onDataChange({ feeds: updatedFeeds });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('加载 RSS 失败:', err.message || err);
    } finally {
      setLoadingFeeds(prev => {
        const next = new Set(prev);
        next.delete(feedId);
        return next;
      });
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    const updatedFeeds = feeds.filter((feed) => feed.id !== feedId);
    setFeeds(updatedFeeds);

    if (activeFeedId === feedId) {
      if (updatedFeeds.length > 0) {
        setActiveFeedId(updatedFeeds[0].id);
      } else {
        setActiveFeedId(null);
      }
    }

    await onDataChange({ feeds: updatedFeeds });
  };

  const formatPubDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getTotalItems = () => {
    return feeds.reduce((total, feed) => total + feed.items.length, 0);
  };

  return (
    <div className="rss-widget widget-content">
      <h3 className="widget-title" onClick={onToggleCollapsed}>
        <span>{widget.title}</span>
        <Down className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} colors={['currentColor', 'currentColor']} />
      </h3>
      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">{feeds.length} 个源，{getTotalItems()} 篇文章</span>
        </div>
      ) : (
        <>
          <div className="rss-feeds">
            {feeds.length === 0 ? (
              <div className="empty-state">暂无 RSS 源</div>
            ) : (
              <>
                <div className="rss-tabs">
                  {feeds.map((feed) => (
                    <button
                      key={feed.id}
                      className={`rss-tab ${activeFeedId === feed.id ? 'active' : ''}`}
                      onClick={() => setActiveFeedId(feed.id)}
                    >
                      {feed.name}
                    </button>
                  ))}
                </div>

                {activeFeedId && feeds.find(f => f.id === activeFeedId) && (
                  <div className="rss-feed">
                    <div className="rss-feed-header">
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          onClick={() => loadRSSFeed(activeFeedId, feeds.find(f => f.id === activeFeedId)!.url)}
                          disabled={loadingFeeds.has(activeFeedId)}
                          className="rss-refresh-btn"
                          title="刷新"
                        >
                          <Refresh size={14} className={loadingFeeds.has(activeFeedId) ? 'spinning' : ''} />
                        </button>
                        <button
                          onClick={() => handleDeleteFeed(activeFeedId)}
                          className="rss-delete-btn"
                          title="删除"
                        >
                          <Delete size={14} />
                        </button>
                      </div>
                    </div>
                    <ul className="rss-items">
                      {(() => {
                        const feed = feeds.find(f => f.id === activeFeedId)!;
                        if (feed.items.length === 0) {
                          if (loadingFeeds.has(activeFeedId)) {
                            return <li className="empty-state loading">正在加载...</li>;
                          } else if ((feed as any).error) {
                            return (
                              <li className="empty-state error">
                                RSS 解析失败：{(feed as any).error}
                                <br />
                                <span style={{ fontSize: '10px', color: '#999' }}>
                                  rss2json 免费版每月限 10000 次请求
                                </span>
                              </li>
                            );
                          } else {
                            return <li className="empty-state">暂无内容，点击刷新</li>;
                          }
                        } else {
                          const currentPage = feedPages[activeFeedId] || 0;
                          return (
                            <>
                              {feed.items
                                .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
                                .map((item: RSSItem) => (
                                  <li key={item.id} className="rss-item">
                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                      {item.title}
                                    </a>
                                    {item.pubDate && (
                                      <div className="rss-date">{formatPubDate(item.pubDate)}</div>
                                    )}
                                  </li>
                                ))}
                              <li className="rss-pagination">
                                <button
                                  onClick={() => handlePageChange(activeFeedId, -1)}
                                  disabled={currentPage === 0}
                                  className="page-btn prev"
                                >
                                  上一页
                                </button>
                                <span className="page-info">
                                  {currentPage + 1} / {Math.ceil(feed.items.length / ITEMS_PER_PAGE)}
                                </span>
                                <button
                                  onClick={() => handlePageChange(activeFeedId, 1)}
                                  disabled={(currentPage + 1) * ITEMS_PER_PAGE >= feed.items.length}
                                  className="page-btn next"
                                >
                                  下一页
                                </button>
                              </li>
                            </>
                          );
                        }
                      })()}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {showAddForm ? (
            <div className="add-rss-form">
              <input
                type="text"
                placeholder="源名称"
                value={newFeedName}
                onChange={(e) => setNewFeedName(e.target.value)}
              />
              <input
                type="text"
                placeholder="RSS 链接 (https://...)"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFeed()}
              />
              <button onClick={handleAddFeed}>添加</button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewFeedName('');
                  setNewFeedUrl('');
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              className="add-rss-source-btn"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              添加 RSS 源
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default RSSWidget;
