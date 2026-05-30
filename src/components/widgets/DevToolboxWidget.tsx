import React, { useState, useCallback } from 'react';

interface DevToolboxWidgetProps {
  widget: any;
  tabId: string;
  onDataChange: (data: any) => void;
  onDelete: () => void;
  onToggleCollapsed: () => void;
}

type ToolTab = 'json' | 'base64' | 'timestamp';

const DevToolboxWidget: React.FC<DevToolboxWidgetProps> = ({ widget, onDataChange, onDelete, onToggleCollapsed }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>(widget.data?.activeTab || 'json');

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
    } catch (e: any) {
      setJsonError(e.message);
      setJsonOutput('');
    }
  }, [jsonInput]);

  const handleJsonMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError('');
    } catch (e: any) {
      setJsonError(e.message);
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
      setBase64Output('⚠️ 无效的 Base64 输入');
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
        setTsOutput('⚠️ 无法识别的时间格式');
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
      setTsOutput('⚠️ 无效的时间戳');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const tabs: { key: ToolTab; label: string }[] = [
    { key: 'json', label: 'JSON' },
    { key: 'base64', label: 'Base64' },
    { key: 'timestamp', label: '时间戳' },
  ];

  return (
    <div className="widget-container">
      <div className="widget-header">
        <span className="widget-title" onClick={onToggleCollapsed}>
          {widget.title || '开发者工具箱'}
        </span>
        <div className="widget-header-actions">
          <button className="widget-action-btn" onClick={onDelete} title="删除">
            ×
          </button>
        </div>
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
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'json' && (
            <div className="devtoolbox-panel">
              <textarea
                className="devtoolbox-input"
                placeholder='粘贴 JSON，如 {"key": "value"}'
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                spellCheck={false}
                rows={5}
              />
              <div className="devtoolbox-actions">
                <button className="devtoolbox-btn" onClick={handleJsonFormat}>格式化</button>
                <button className="devtoolbox-btn" onClick={handleJsonMinify}>压缩</button>
                {jsonOutput && (
                  <button className="devtoolbox-btn devtoolbox-btn-copy" onClick={() => copyToClipboard(jsonOutput)}>
                    复制结果
                  </button>
                )}
              </div>
              {jsonError && <div className="devtoolbox-error">{jsonError}</div>}
              {jsonOutput && (
                <pre className="devtoolbox-output">{jsonOutput}</pre>
              )}
            </div>
          )}

          {activeTab === 'base64' && (
            <div className="devtoolbox-panel">
              <div className="devtoolbox-actions">
                <button
                  className={`devtoolbox-btn ${base64Mode === 'decode' ? 'active' : ''}`}
                  onClick={() => setBase64Mode('decode')}
                >
                  解码
                </button>
                <button
                  className={`devtoolbox-btn ${base64Mode === 'encode' ? 'active' : ''}`}
                  onClick={() => setBase64Mode('encode')}
                >
                  编码
                </button>
              </div>
              <textarea
                className="devtoolbox-input"
                placeholder={base64Mode === 'decode' ? '粘贴 Base64 字符串' : '输入要编码的文本'}
                value={base64Input}
                onChange={e => setBase64Input(e.target.value)}
                spellCheck={false}
                rows={3}
              />
              <div className="devtoolbox-actions">
                <button className="devtoolbox-btn" onClick={handleBase64Convert}>
                  {base64Mode === 'decode' ? '解码' : '编码'}
                </button>
                {base64Output && !base64Output.startsWith('⚠️') && (
                  <button className="devtoolbox-btn devtoolbox-btn-copy" onClick={() => copyToClipboard(base64Output)}>
                    复制结果
                  </button>
                )}
              </div>
              {base64Output && (
                <pre className="devtoolbox-output">{base64Output}</pre>
              )}
            </div>
          )}

          {activeTab === 'timestamp' && (
            <div className="devtoolbox-panel">
              <input
                className="devtoolbox-input devtoolbox-input-oneline"
                type="text"
                placeholder="输入时间戳或日期，如 1717000000 或 2025-01-01"
                value={tsInput}
                onChange={e => setTsInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTimestampConvert()}
                spellCheck={false}
              />
              <div className="devtoolbox-actions">
                <button className="devtoolbox-btn" onClick={handleTimestampConvert}>转换</button>
                <button className="devtoolbox-btn" onClick={() => { setTsInput(String(Math.floor(Date.now() / 1000))); }}>
                  当前秒
                </button>
                <button className="devtoolbox-btn" onClick={() => { setTsInput(String(Date.now())); }}>
                  当前毫秒
                </button>
              </div>
              {tsOutput && (
                <pre className="devtoolbox-output">{tsOutput}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevToolboxWidget;
