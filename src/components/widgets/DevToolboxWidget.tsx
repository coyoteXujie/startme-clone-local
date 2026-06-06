import React, { useState, useCallback } from 'react';
import { Code, LockOne, Timer, Copy, CheckOne, Refresh } from '@icon-park/react';
import { DevToolboxTab, WidgetDataFor, WidgetOfType } from '../../types';

interface DevToolboxWidgetProps {
  widget: WidgetOfType<'devtoolbox'>;
  tabId: string;
  columnId: string;
  onDataChange: (data: WidgetDataFor<'devtoolbox'>) => Promise<void> | void;
  onDelete: () => void;
  onToggleCollapsed: () => void;
}

type ToolTab = DevToolboxTab;

const DevToolboxWidget: React.FC<DevToolboxWidgetProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>(widget.data?.activeTab || 'json');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('decode');

  const [tsInput, setTsInput] = useState('');
  const [tsOutput, setTsOutput] = useState('');

  const handleTabChange = (tab: ToolTab) => {
    setActiveTab(tab);
    onDataChange({ activeTab: tab });
  };

  const handleJsonFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : 'JSON 解析失败');
      setJsonOutput('');
    }
  }, [jsonInput]);

  const handleJsonMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError('');
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : 'JSON 解析失败');
      setJsonOutput('');
    }
  }, [jsonInput]);

  const handleBase64Convert = useCallback(() => {
    try {
      if (base64Mode === 'decode') {
        const decoded = atob(base64Input.trim());
        const utf8 = new TextDecoder().decode(new Uint8Array([...decoded].map(c => c.charCodeAt(0))));
        setBase64Output(utf8);
      } else {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(base64Input);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        setBase64Output(btoa(binary));
      }
    } catch {
      setBase64Output('');
    }
  }, [base64Input, base64Mode]);

  const handleTimestampConvert = useCallback(() => {
    const raw = tsInput.trim();
    if (!raw) { setTsOutput(''); return; }

    const num = Number(raw);
    if (isNaN(num)) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        setTsOutput(`Unix: ${Math.floor(d.getTime() / 1000)}\n毫秒: ${d.getTime()}\n\n${d.toLocaleString('zh-CN', { hour12: false })}`);
      } else {
        setTsOutput('');
      }
      return;
    }

    let ts = num;
    if (ts > 1e12) {
      ts = Math.floor(ts);
    } else {
      ts = Math.floor(ts) * 1000;
    }

    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      setTsOutput('');
      return;
    }

    const now = Date.now();
    const diff = ts - now;
    const diffStr = diff > 0
      ? `${Math.abs(diff / 1000 / 60 / 60 / 24).toFixed(1)} 天后`
      : `${Math.abs(diff / 1000 / 60 / 60 / 24).toFixed(1)} 天前`;

    setTsOutput(
      `本地时间: ${d.toLocaleString('zh-CN', { hour12: false })}\n` +
      `UTC时间:   ${d.toUTCString()}\n` +
      `ISO格式:   ${d.toISOString()}\n` +
      `相对:      ${diffStr}`
    );
  }, [tsInput]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }).catch(() => {});
  };

  const tabs: { key: ToolTab; label: string; icon: React.ReactNode }[] = [
    { key: 'json', label: 'JSON', icon: <Code size={13} /> },
    { key: 'base64', label: 'Base64', icon: <LockOne size={13} /> },
    { key: 'timestamp', label: '时间戳', icon: <Timer size={13} /> },
  ];

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      className={`devtoolbox-btn devtoolbox-btn-copy ${copiedKey === id ? 'copied' : ''}`}
      onClick={() => copyToClipboard(text, id)}
    >
      {copiedKey === id ? <><CheckOne size={12} /> 已复制</> : <><Copy size={12} /> 复制</>}
    </button>
  );

  return (
    <>
      <div className="widget-header">
        <span className="widget-title" onClick={onToggleCollapsed}>
          <Code size={15} className="widget-title-icon" />
          <span>{widget.title || '开发者工具箱'}</span>
        </span>
      </div>
      {!widget.collapsed && (
        <div className="widget-body">
          <div className="devtoolbox-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`devtoolbox-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'json' && (
            <div className="devtoolbox-panel">
              <div className="devtoolbox-field">
                <label className="devtoolbox-label">输入</label>
                <textarea
                  className="devtoolbox-input"
                  placeholder='粘贴 JSON，如 {"key": "value"}'
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  spellCheck={false}
                  rows={4}
                />
              </div>
              <div className="devtoolbox-actions">
                <button className="devtoolbox-btn devtoolbox-btn-primary" onClick={handleJsonFormat}>
                  <Refresh size={12} /> 格式化
                </button>
                <button className="devtoolbox-btn" onClick={handleJsonMinify}>
                  压缩
                </button>
                {jsonOutput && <CopyBtn text={jsonOutput} id="json" />}
              </div>
              {jsonError && (
                <div className="devtoolbox-error">
                  <span className="devtoolbox-error-icon">⚠</span>
                  {jsonError}
                </div>
              )}
              {jsonOutput && (
                <div className="devtoolbox-field">
                  <label className="devtoolbox-label">输出</label>
                  <pre className="devtoolbox-output">{jsonOutput}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'base64' && (
            <div className="devtoolbox-panel">
              <div className="devtoolbox-mode-toggle">
                <button
                  className={`devtoolbox-mode-btn ${base64Mode === 'decode' ? 'active' : ''}`}
                  onClick={() => setBase64Mode('decode')}
                >
                  <LockOne size={13} /> 解码
                </button>
                <button
                  className={`devtoolbox-mode-btn ${base64Mode === 'encode' ? 'active' : ''}`}
                  onClick={() => setBase64Mode('encode')}
                >
                  <LockOne size={13} /> 编码
                </button>
              </div>
              <div className="devtoolbox-field">
                <label className="devtoolbox-label">
                  {base64Mode === 'decode' ? 'Base64 字符串' : '待编码文本'}
                </label>
                <textarea
                  className="devtoolbox-input"
                  placeholder={base64Mode === 'decode' ? '粘贴 Base64 字符串' : '输入要编码的文本'}
                  value={base64Input}
                  onChange={e => setBase64Input(e.target.value)}
                  spellCheck={false}
                  rows={3}
                />
              </div>
              <div className="devtoolbox-actions">
                <button className="devtoolbox-btn devtoolbox-btn-primary" onClick={handleBase64Convert}>
                  <Refresh size={12} /> {base64Mode === 'decode' ? '解码' : '编码'}
                </button>
                {base64Output && !base64Output.startsWith('⚠') && (
                  <CopyBtn text={base64Output} id="base64" />
                )}
              </div>
              {base64Output && (
                <div className="devtoolbox-field">
                  <label className="devtoolbox-label">结果</label>
                  <pre className="devtoolbox-output">{base64Output}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timestamp' && (
            <div className="devtoolbox-panel">
              <div className="devtoolbox-field">
                <label className="devtoolbox-label">时间戳 / 日期</label>
                <input
                  className="devtoolbox-input devtoolbox-input-oneline"
                  type="text"
                  placeholder="输入时间戳或日期，如 1717000000"
                  value={tsInput}
                  onChange={e => setTsInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTimestampConvert()}
                  spellCheck={false}
                />
              </div>
              <div className="devtoolbox-actions">
                <button className="devtoolbox-btn devtoolbox-btn-primary" onClick={handleTimestampConvert}>
                  <Refresh size={12} /> 转换
                </button>
                <div className="devtoolbox-actions-group">
                  <button className="devtoolbox-btn devtoolbox-btn-quick" onClick={() => { setTsInput(String(Math.floor(Date.now() / 1000))); }}>
                    当前秒
                  </button>
                  <button className="devtoolbox-btn devtoolbox-btn-quick" onClick={() => { setTsInput(String(Date.now())); }}>
                    当前毫秒
                  </button>
                </div>
              </div>
              {tsOutput && (
                <div className="devtoolbox-field">
                  <label className="devtoolbox-label">转换结果</label>
                  <pre className="devtoolbox-output devtoolbox-output-ts">{tsOutput}</pre>
                  <div className="devtoolbox-output-actions">
                    <CopyBtn text={tsOutput} id="ts" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DevToolboxWidget;
