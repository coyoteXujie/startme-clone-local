export const FALLBACK_SEARCH_URL = 'https://www.baidu.com/s?wd=';

/**
 * 将用户输入规范化为 http/https URL。
 * 搜索引擎模板允许包含 {query} 或 %s，占位符会先替换成测试字符串再交给 URL 校验。
 */
export const normalizeHttpUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol.replace('{query}', 'test').replace('%s', 'test'));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return withProtocol;
  } catch {
    return null;
  }
};

/**
 * 根据搜索引擎 URL 模板生成最终搜索地址。
 * 兼容常见三类模板：{query}、%s、以等号结尾的查询参数。
 */
export const buildSearchUrl = (engineUrl: string | undefined, query: string): string => {
  const encodedQuery = encodeURIComponent(query);
  const normalizedUrl = normalizeHttpUrl(engineUrl || '') || FALLBACK_SEARCH_URL;

  if (normalizedUrl.includes('{query}')) {
    return normalizedUrl.split('{query}').join(encodedQuery);
  }
  if (normalizedUrl.includes('%s')) {
    return normalizedUrl.split('%s').join(encodedQuery);
  }
  if (normalizedUrl.endsWith('=')) {
    return `${normalizedUrl}${encodedQuery}`;
  }

  const separator = normalizedUrl.includes('?')
    ? (normalizedUrl.endsWith('?') || normalizedUrl.endsWith('&') ? '' : '&')
    : '?';
  return `${normalizedUrl}${separator}q=${encodedQuery}`;
};
