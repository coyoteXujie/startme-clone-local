import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

type Timeout = ReturnType<typeof setTimeout>;

interface PomodoroProps {
  widget: any;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onToggleCollapsed: () => void;
}

const PomodoroWidget: React.FC<PomodoroProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const WORK_DURATION = 25 * 60;
  const BREAK_DURATION = 5 * 60;

  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<Timeout | null>(null);

  useEffect(() => {
    if (widget.data) {
      setTimeLeft(widget.data.timeLeft ?? WORK_DURATION);
      setIsRunning(widget.data.isRunning ?? false);
      setIsBreak(widget.data.isBreak ?? false);
      setCycles(widget.data.cycles ?? 0);
    }
  }, [widget.data]);

  const playBeep = useCallback(() => {
    let audio: AudioContext | null = null;
    try {
      audio = new AudioContext();
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
      oscillator.onended = () => audio?.close();
    } catch {
      audio?.close();
    }
  }, []);

  const saveState = useCallback((updates: Partial<{ timeLeft: number; isRunning: boolean; isBreak: boolean; cycles: number }>) => {
    onDataChange({ ...widget.data, ...updates });
  }, [widget.data, onDataChange]);

  const handleTimeUp = useCallback(() => {
    if (!isBreak) {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      setIsBreak(true);
      setTimeLeft(BREAK_DURATION);
      saveState({ timeLeft: BREAK_DURATION, isBreak: true, cycles: newCycles, isRunning: false });
    } else {
      setIsBreak(false);
      setTimeLeft(WORK_DURATION);
      saveState({ timeLeft: WORK_DURATION, isBreak: false, isRunning: false });
    }
    playBeep();
  }, [isBreak, cycles, saveState, playBeep]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, handleTimeUp]);

  const handleStartPause = () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    saveState({ isRunning: newRunning });
  };

  const handleReset = () => {
    const duration = isBreak ? BREAK_DURATION : WORK_DURATION;
    setIsRunning(false);
    setTimeLeft(duration);
    saveState({ isRunning: false, timeLeft: duration });
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
    const total = isBreak ? BREAK_DURATION : WORK_DURATION;
    return ((total - timeLeft) / total) * 100;
  };

  const phase = isBreak ? 'break' : 'work';

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
          <div className={`pomodoro-phase ${phase}`}>
            {isBreak ? '🌙 休息时间' : '🍅 专注时间'}
          </div>

          <div className={`pomodoro-time ${phase}`}>
            {formatTime(timeLeft)}
          </div>

          <div className="pomodoro-progress-track">
            <div
              className={`pomodoro-progress-fill ${phase}`}
              style={{ width: `${getProgress()}%` }}
            />
          </div>

          <div className="pomodoro-controls">
            <button
              className={`pomodoro-btn primary ${isRunning ? 'running' : ''}`}
              onClick={handleStartPause}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? '暂停' : '开始'}
            </button>

            <button className="pomodoro-btn secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              重置
            </button>

            <button className="pomodoro-btn secondary" onClick={handleSkip}>
              <SkipForward size={16} />
              跳过
            </button>
          </div>

          <div className="pomodoro-status">
            已完成 {cycles} 个专注周期
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroWidget;
