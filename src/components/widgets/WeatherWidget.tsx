import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Widget } from '../../types';
import { Down, Plus, Close } from '@icon-park/react';
import { Sun, Cloud, CloudRain, CloudDrizzle, Snowflake, CloudLightning } from 'lucide-react';

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

const WMO_TO_ICON: Record<string, any> = {
  'sun': Sun,
  'cloud-sun': Cloud,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'snowflake': Snowflake,
  'cloud-snow': Snowflake,
  'cloud-lightning': CloudLightning,
  'cloud': Cloud,
};

const getWeatherIconName = (code: number): string => {
  if (code === 0) return 'sun';
  if (code >= 1 && code <= 3) return 'cloud-sun';
  if (code >= 45 && code <= 48) return 'cloud-drizzle';
  if (code >= 51 && code <= 67) return 'cloud-rain';
  if (code >= 71 && code <= 77) return 'snowflake';
  if (code >= 80 && code <= 82) return 'cloud-rain';
  if (code >= 85 && code <= 86) return 'snowflake';
  if (code >= 95) return 'cloud-lightning';
  return 'cloud';
};

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 监听外部数据变化，同步更新本地状态
  useEffect(() => {
    if (widget.data.cities) {
      setCities(widget.data.cities);
      if (!widget.data.cities.includes(activeCity)) {
        setActiveCity(widget.data.cities[0]);
      }
    }
  }, [widget.data.cities, activeCity]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWeather = useCallback(async (city: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const coords = CITY_COORDS[city] || { lat: 39.9042, lon: 116.4074 };
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=3`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('天气 API 请求失败');
      const data = await res.json();
      const daily = data.daily;

      const forecast = daily.time.slice(0, 3).map((dateStr: string, index: number) => ({
        day: index === 0 ? '今天' : getDayOfWeek(dateStr),
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index]),
        icon: getWeatherIconName(daily.weather_code[index]),
      }));

      setWeather({ city, forecast });
      setLastUpdated(new Date());
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') return;
      console.error('获取天气失败:', error);
      setWeather({
        city,
        forecast: Array(3).fill(null).map((_, i) => ({
          day: i === 0 ? '今天' : getDayOfWeek(new Date(Date.now() + i * 86400000).toISOString()),
          high: 20,
          low: 10,
          icon: 'cloud',
        })),
      });
    }
  }, []);

  useEffect(() => {
    fetchWeather(activeCity);

    // 设置15分钟自动更新
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      fetchWeather(activeCity);
    }, 15 * 60 * 1000); // 15分钟

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeCity, fetchWeather]);

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
    if (activeCity === cityToRemove) setActiveCity(updatedCities[0]);
    await onDataChange({ cities: updatedCities });
  };

  const renderWeatherIcon = (iconName: string, size: number = 24) => {
    const IconComponent = WMO_TO_ICON[iconName] || Cloud;

    // 根据天气类型设置不同的颜色
    let color = '#6b7280'; // 默认灰色
    if (iconName === 'sun') color = '#f59e0b'; // 晴天橙色
    else if (iconName.includes('rain')) color = '#3b82f6'; // 雨天蓝色
    else if (iconName.includes('snow')) color = '#0ea5e9'; // 雪天蓝绿色
    else if (iconName.includes('lightning')) color = '#f97316'; // 雷暴橙色

    return <IconComponent size={size} color={color} strokeWidth={2} />;
  };

  return (
    <div className="weather-widget widget-content">
      <div className="weather-widget-header">
        <h3 className="widget-title" onClick={onToggleCollapsed}>
          <span>{widget.title}</span>
          <Down className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} colors={['currentColor', 'currentColor']} />
        </h3>
        {cities.length > 1 && (
          <button
            className="weather-city-remove"
            onClick={() => handleRemoveCity(activeCity)}
            title={`移除${activeCity}`}
          >
            <Close size={14} />
          </button>
        )}
      </div>

      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">{activeCity}: {weather?.forecast?.[0]?.high}°/{weather?.forecast?.[0]?.low}°</span>
        </div>
      ) : (
        <>
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

          {showAddCity && (
            <div className="weather-add-city-input">
              <input
                type="text"
                placeholder="城市名称（如：北京）"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
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
              <div className="weather-forecast">
                {weather.forecast.map((day, index) => (
                  <div key={index} className={`forecast-day${index === 0 ? ' forecast-day-today' : ''}`}>
                    <div className="forecast-day-name">{day.day}</div>
                    <div className="forecast-icon">
                      {renderWeatherIcon(day.icon, 28)}
                    </div>
                    <div className="forecast-temp">
                      <span className="forecast-high">{day.high}°</span>
                      <span className="forecast-divider">/</span>
                      <span className="forecast-low">{day.low}°</span>
                    </div>
                  </div>
                ))}
              </div>
              {lastUpdated && (
                <div className="weather-update-time">
                  更新于 {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
