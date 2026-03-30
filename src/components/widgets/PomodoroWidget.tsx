import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Play, Pause, RotateCcw } from 'lucide-react';

interface PomodoroProps {
  widget: any;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onToggleCollapsed: () => void;
}

const PomodoroWidget: React.FC<PomodoroProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const [workDuration] = useState(25 * 60); // 25 分钟
  const [breakDuration] = useState(5 * 60); // 5 分钟
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<number | null>(null);

  // 从存储中加载状态
  useEffect(() => {
    if (widget.data.timeLeft !== undefined) {
      setTimeLeft(widget.data.timeLeft);
      setIsRunning(widget.data.isRunning || false);
      setIsBreak(widget.data.isBreak || false);
      setCycles(widget.data.cycles || 0);
    }
  }, []);

  // 保存状态到存储
  const saveState = (updates: Partial<{ timeLeft: number; isRunning: boolean; isBreak: boolean; cycles: number }>) => {
    onDataChange({ ...widget.data, ...updates });
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newVal = prev - 1;
          saveState({ timeLeft: newVal });
          return newVal;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      // 时间到
      if (!isBreak) {
        // 工作结束，休息
        const newCycles = cycles + 1;
        setCycles(newCycles);
        setIsBreak(true);
        setTimeLeft(breakDuration);
        saveState({ timeLeft: breakDuration, isBreak: true, cycles: newCycles });
      } else {
        // 休息结束，工作
        setIsBreak(false);
        setTimeLeft(workDuration);
        saveState({ timeLeft: workDuration, isBreak: false });
      }
      // 播放提示音（可选）
      try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gainNode = audio.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audio.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audio.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.5);
        oscillator.start(audio.currentTime);
        oscillator.stop(audio.currentTime + 0.5);
      } catch (e) {
        // 忽略音频错误
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft, isBreak, cycles, workDuration, breakDuration]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    saveState({ isRunning: !isRunning });
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? breakDuration : workDuration);
    saveState({ isRunning: false, timeLeft: isBreak ? breakDuration : workDuration });
  };

  const handleSkip = () => {
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = isBreak ? breakDuration : workDuration;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="widget-content">
      <h3 className="widget-title" onClick={onToggleCollapsed}>
        <span>{widget.title || '番茄钟'}</span>
        <ChevronDown className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
      </h3>

      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">
            {isRunning ? formatTime(timeLeft) : `${cycles} 个周期`}
          </span>
        </div>
      ) : (
        <div className="pomodoro-display">
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            {isBreak ? '🌙 休息时间' : '🍅 专注时间'}
          </div>

          <div className="pomodoro-time" style={{
            fontSize: '48px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-mono)',
            color: isBreak ? '#10b981' : '#f59e0b',
            lineHeight: 1,
            margin: '16px 0',
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* 进度条 */}
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}>
            <div style={{
              width: `${getProgress()}%`,
              height: '100%',
              background: isBreak
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              transition: 'width 1s linear',
            }} />
          </div>

          {/* 控制按钮 */}
          <div className="pomodoro-controls" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              className="pomodoro-btn primary"
              onClick={handleStartPause}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 24px',
                background: 'var(--primary-gradient)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-primary)',
              }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? '暂停' : '开始'}
            </button>

            <button
              className="pomodoro-btn secondary"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 24px',
                background: '#e5e7eb',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                transition: 'all var(--transition-fast)',
              }}
            >
              <RotateCcw size={18} />
              重置
            </button>

            {!isBreak && (
              <button
                className="pomodoro-btn secondary"
                onClick={handleSkip}
                style={{
                  padding: '10px 24px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  transition: 'all var(--transition-fast)',
                }}
              >
                跳过
              </button>
            )}
          </div>

          {/* 周期统计 */}
          <div className="pomodoro-status" style={{
            fontSize: '13px',
            color: '#6b7280',
            marginTop: '16px',
          }}>
            已完成 {cycles} 个专注周期
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroWidget;
