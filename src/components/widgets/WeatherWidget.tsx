import React, { useState, useEffect } from 'react';
import { Widget } from '../../types';
import { ChevronDown, Plus, X } from 'lucide-react';

interface WeatherWidgetProps {
  widget: Widget;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onToggleCollapsed: () => void;
}

interface WeatherInfo {
  city: string;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    icon: string;
  }>;
}

// 城市名称到经纬度的映射（用于 Open-Meteo API）
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  '北京': { lat: 39.9042, lon: 116.4074 },
  '上海': { lat: 31.2304, lon: 121.4737 },
  '西安': { lat: 34.3416, lon: 108.9398 },
  '深圳': { lat: 22.5431, lon: 114.0579 },
  '广州': { lat: 23.1291, lon: 113.2644 },
  '成都': { lat: 30.5728, lon: 104.0668 },
  '杭州': { lat: 30.2741, lon: 120.1551 },
  '重庆': { lat: 29.4316, lon: 106.9123 },
  '武汉': { lat: 30.5928, lon: 114.3055 },
  '南京': { lat: 32.0603, lon: 118.7969 },
};

// WMO 天气代码转 lucide 图标名称
const getWeatherIcon = (code: number): string => {
  if (code === 0) return 'sun';
  if (code >= 1 && code <= 3) return 'cloud-sun';
  if (code >= 45 && code <= 48) return 'cloud-drizzle';
  if (code >= 51 && code <= 67) return 'cloud-rain';
  if (code >= 71 && code <= 77) return 'snowflake';
  if (code >= 80 && code <= 82) return 'cloud-rain';
  if (code >= 85 && code <= 86) return 'cloud-snow';
  if (code >= 95) return 'cloud-lightning';
  return 'cloud';
};

// 获取星期几
const getDayOfWeek = (dateStr: string): string => {
  const date = new Date(dateStr);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const [cities, setCities] = useState<string[]>(widget.data.cities || ['北京']);
  const [activeCity, setActiveCity] = useState(cities[0]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    fetchWeather(activeCity);
  }, [activeCity]);

  const fetchWeather = async (city: string) => {
    try {
      const coords = CITY_COORDS[city] || { lat: 39.9042, lon: 116.4074 };

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=7`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('天气 API 请求失败');
      }

      const data = await res.json();
      const daily = data.daily;

      // 显示 6 天预报（今天 + 未来 5 天）
      const forecast = daily.time.slice(0, 6).map((dateStr: string, index: number) => ({
        day: index === 0 ? '今天' : getDayOfWeek(dateStr),
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index]),
        icon: getWeatherIcon(daily.weather_code[index]),
      }));

      setWeather({
        city,
        forecast,
      });
    } catch (error) {
      console.error('获取天气失败:', error);
      setWeather({
        city,
        // 6 天预报（今天 +5 天）
        forecast: Array(6).fill(null).map((_, i) => ({
          day: i === 0 ? '今天' : getDayOfWeek(new Date(Date.now() + i * 86400000).toISOString()),
          high: 20,
          low: 10,
          icon: 'cloud',
        })),
      });
    }
  };

  const handleAddCity = async () => {
    if (!newCity.trim()) return;
    const updatedCities = [...cities, newCity.trim()];
    setCities(updatedCities);
    setActiveCity(newCity.trim());
    await onDataChange({ cities: updatedCities });
    setNewCity('');
    setShowAddCity(false);
  };

  const handleRemoveCity = async (cityToRemove: string) => {
    if (cities.length === 1) {
      alert('至少保留一个城市');
      return;
    }
    const updatedCities = cities.filter((c) => c !== cityToRemove);
    setCities(updatedCities);
    if (activeCity === cityToRemove) {
      setActiveCity(updatedCities[0]);
    }
    await onDataChange({ cities: updatedCities });
  };

  const renderWeatherIcon = (iconName: string, size: number = 24) => {
    const icons: Record<string, React.ReactNode> = {
      'sun': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
      'cloud-sun': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.657a4 4 0 1 1-5.89-3.78l.208-.125a3.5 3.5 0 0 1 5.047 4.15l-.2.125a4.002 4.002 0 0 1-1.165 6.973"/><path d="M12 20v2"/><path d="m6.34 17.66-1.41 1.41"/><path d="M2 12h2"/></svg>,
      'cloud-drizzle': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v2"/><path d="M8 13v2"/><path d="M16 19v2"/><path d="M16 13v2"/><path d="M12 21v2"/><path d="M12 15v2"/></svg>,
      'cloud-rain': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>,
      'snowflake': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m20 20-8-8-8 8"/><path d="m4 4 8 8 8-8"/></svg>,
      'cloud-snow': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/></svg>,
      'cloud-lightning': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m15 14-6 6 4-1h4Z"/><path d="M13 14v6"/></svg>,
      'cloud': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/></svg>,
    };
    return icons[iconName] || icons['cloud'];
  };

  return (
    <div className="weather-widget widget-content">
      <div className="weather-widget-header">
        <h3 className="widget-title" onClick={onToggleCollapsed}>
          <span>{widget.title}</span>
          <ChevronDown className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
        </h3>
        {cities.length > 1 && (
          <button
            className="weather-city-remove"
            onClick={() => handleRemoveCity(activeCity)}
            title={`移除${activeCity}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">{activeCity}: {weather?.forecast?.[0]?.high}°/{weather?.forecast?.[0]?.low}°</span>
        </div>
      ) : (
        <>
          {/* 城市选择 */}
          <div className="weather-cities">
            {cities.map((city) => (
              <button
                key={city}
                className={`weather-city ${activeCity === city ? 'active' : ''}`}
                onClick={() => setActiveCity(city)}
              >
                {city}
              </button>
            ))}
            <button className="weather-add-city" onClick={() => setShowAddCity(!showAddCity)} title="添加城市">
              <Plus size={14} />
            </button>
          </div>

          {/* 添加城市输入框 */}
          {showAddCity && (
            <div className="weather-add-city-input">
              <input
                type="text"
                placeholder="城市名称（如：北京）"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
                autoFocus
                onBlur={() => !newCity && setShowAddCity(false)}
              />
              <button className="btn-confirm" onClick={handleAddCity}>
                <Plus size={16} />
              </button>
            </div>
          )}

          {weather && (
            <>
              {/* 天气预报（今天 + 未来 5 天，共 6 天） */}
              <div className="weather-forecast">
                {weather.forecast.map((day, index) => (
                  <div key={index} className={`forecast-day${index === 0 ? ' forecast-day-today' : ''}`}>
                    <div className="forecast-day-name">{day.day}</div>
                    <div className="forecast-icon">
                      {renderWeatherIcon(day.icon, 24)}
                    </div>
                    <div className="forecast-temp">
                      <span className="forecast-high">{day.high}°</span>
                      <span className="forecast-low">{day.low}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
