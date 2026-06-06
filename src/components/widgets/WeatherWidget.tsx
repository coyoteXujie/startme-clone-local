import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetDataFor, WidgetOfType } from '../../types';
import { Down, Plus, Close } from '@icon-park/react';
import { Sun, Cloud, CloudRain, CloudDrizzle, Snowflake, CloudLightning } from 'lucide-react';

interface WeatherWidgetProps {
  widget: WidgetOfType<'weather'>;
  tabId: string;
  columnId: string;
  onDataChange: (data: WidgetDataFor<'weather'>) => Promise<void> | void;
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

interface CityCoords {
  lat: number;
  lon: number;
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

const cityCoordsCache = new Map<string, CityCoords>(Object.entries(CITY_COORDS));

const resolveCityCoords = async (city: string, signal: AbortSignal): Promise<CityCoords> => {
  const cityName = city.trim();
  const cached = cityCoordsCache.get(cityName);
  if (cached) return cached;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=zh&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error('城市解析失败');
  }

  const data = await res.json();
  const firstResult = data.results?.[0];
  if (!firstResult) {
    throw new Error(`未找到城市：${cityName}`);
  }

  const coords = {
    lat: Number(firstResult.latitude),
    lon: Number(firstResult.longitude),
  };
  cityCoordsCache.set(cityName, coords);
  return coords;
};

const WMO_TO_ICON: Record<string, typeof Sun> = {
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

const getWeatherErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '请求已取消';
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '无法连接天气服务，请检查网络、代理或扩展权限';
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widget, onDataChange, onToggleCollapsed }) => {
  const [cities, setCities] = useState<string[]>(widget.data.cities || ['北京']);
  const [activeCity, setActiveCity] = useState(cities[0]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherError, setWeatherError] = useState('');
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [savingCity, setSavingCity] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 监听外部数据变化，同步更新本地状态
  useEffect(() => {
    if (widget.data.cities) {
      const nextCities = widget.data.cities;
      setCities(nextCities);
      setActiveCity(prev => nextCities.includes(prev) ? prev : nextCities[0]);
    }
  }, [widget.data.cities]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWeather = useCallback(async (city: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000);

    try {
      const cityName = city.trim();
      if (!cityName) return;

      setWeatherError('');
      setWeather(null);
      setLastUpdated(null);
      const coords = await resolveCityCoords(cityName, controller.signal);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=3`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) throw new Error('天气 API 请求失败');
      const data = await res.json();
      const daily = data.daily;

      const forecast = daily.time.slice(0, 3).map((dateStr: string, index: number) => ({
        day: index === 0 ? '今天' : getDayOfWeek(dateStr),
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index]),
        icon: getWeatherIconName(daily.weather_code[index]),
      }));

      setWeather({ city: cityName, forecast });
      setWeatherError('');
      setLastUpdated(new Date());
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError' && !timedOut) return;
      console.warn('获取天气失败:', error);
      setWeather(null);
      setLastUpdated(null);
      setWeatherError(timedOut ? '天气请求超时，请稍后重试' : getWeatherErrorMessage(error, '获取天气失败'));
    } finally {
      clearTimeout(timeoutId);
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
    const cityName = newCity.trim();
    if (!cityName || savingCity) return;
    if (cities.includes(cityName)) {
      setActiveCity(cityName);
      setNewCity('');
      setShowAddCity(false);
      return;
    }

    setSavingCity(true);
    setWeatherError('');
    const validationController = new AbortController();
    const timeoutId = setTimeout(() => validationController.abort(), 10000);
    try {
      await resolveCityCoords(cityName, validationController.signal);

      const updatedCities = [...cities, cityName];
      await onDataChange({ cities: updatedCities });
      setCities(updatedCities);
      setActiveCity(cityName);
      setNewCity('');
      setShowAddCity(false);
    } catch (error: unknown) {
      console.warn('添加城市失败:', error);
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setWeatherError(aborted ? '城市解析超时，请稍后重试' : getWeatherErrorMessage(error, '添加城市失败'));
    } finally {
      clearTimeout(timeoutId);
      setSavingCity(false);
    }
  };

  const handleRemoveCity = async (cityToRemove: string) => {
    if (cities.length === 1) {
      setWeatherError('至少保留一个城市');
      return;
    }
    const updatedCities = cities.filter((c) => c !== cityToRemove);
    try {
      await onDataChange({ cities: updatedCities });
      setCities(updatedCities);
      if (activeCity === cityToRemove) setActiveCity(updatedCities[0]);
    } catch (error: unknown) {
      console.warn('移除城市失败:', error);
      setWeatherError(getWeatherErrorMessage(error, '移除城市失败'));
    }
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
      <div className="widget-header">
        <span className="widget-title" onClick={onToggleCollapsed}>
          <span>{widget.title}</span>
          <Down className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} colors={['currentColor', 'currentColor']} />
        </span>
        <div className="widget-header-actions">
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
      </div>

      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">
            {weather?.forecast?.[0]
              ? `${activeCity}: ${weather.forecast[0].high}°/${weather.forecast[0].low}°`
              : weatherError || '天气加载中'}
          </span>
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
                disabled={savingCity}
                autoFocus
                onBlur={() => !newCity && setShowAddCity(false)}
              />
              <button className="btn-confirm" onClick={handleAddCity} disabled={savingCity}>
                <Plus size={16} />
              </button>
            </div>
          )}

          {weatherError && (
            <div className="empty-state weather-error">{weatherError}</div>
          )}

          {!weather && !weatherError && (
            <div className="empty-state loading">正在加载天气...</div>
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
