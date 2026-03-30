import React, { useState } from 'react';
import { Widget, Task } from '../../types';
import { ChevronDown } from 'lucide-react';

interface TaskWidgetProps {
  widget: Widget;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onDelete: () => void;
  onToggleCollapsed: () => void;
}

const TaskWidget: React.FC<TaskWidgetProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const [newTask, setNewTask] = useState('');
  const tasks: Task[] = widget.data.tasks || [];

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    await onDataChange({ tasks: [...tasks, task] });
    setNewTask('');
  };

  const handleToggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? Date.now() : undefined,
          }
        : task
    );
    await onDataChange({ tasks: updatedTasks });
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    await onDataChange({ tasks: updatedTasks });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      // 今天：显示月 - 日 时：分
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
             date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  return (
    <div className="task-widget widget-content">
      <h3 className="widget-title" onClick={onToggleCollapsed}>
        <span>{widget.title}</span>
        <ChevronDown className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
      </h3>
      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">{tasks.filter(t => !t.completed).length} 个未完成任务</span>
        </div>
      ) : (
        <>
          <div className="task-input">
            <input
              type="text"
              placeholder="添加新任务..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <button onClick={handleAddTask}>添加</button>
          </div>
          <ul className="task-list">
            {tasks.length === 0 ? (
              <li className="empty-state">暂无任务</li>
            ) : (
              tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                  />
                  <span>{task.title}</span>
                  <span className="task-time">{formatTime(task.createdAt)}</span>
                  <button
                    className="task-delete"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    ×
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default TaskWidget;
