const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const compiledRoot = path.join(rootDir, '.tmp-tests');

const { buildSearchUrl, normalizeHttpUrl } = require('../.tmp-tests/src/utils/url.js');
const { getDefaultWidgetData, getDefaultWidgetTitle } = require('../.tmp-tests/src/utils/widgetDefaults.js');
const { migrateStorageData, storage } = require('../.tmp-tests/src/utils/storage.js');

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

const main = async () => {
  await test('normalizeHttpUrl adds https and rejects non-http protocols', () => {
    assert.equal(normalizeHttpUrl('example.com'), 'https://example.com');
    assert.equal(normalizeHttpUrl('https://example.com/search?q='), 'https://example.com/search?q=');
    assert.equal(normalizeHttpUrl('javascript:alert(1)'), null);
  });

  await test('buildSearchUrl supports common search templates', () => {
    assert.equal(
      buildSearchUrl('https://example.com/search?q={query}', 'hello world'),
      'https://example.com/search?q=hello%20world',
    );
    assert.equal(
      buildSearchUrl('https://example.com/search?q=%s', 'a+b'),
      'https://example.com/search?q=a%2Bb',
    );
    assert.equal(
      buildSearchUrl('example.com/search?', '天气'),
      'https://example.com/search?q=%E5%A4%A9%E6%B0%94',
    );
  });

  await test('default widget data stays complete for all widget types', () => {
    assert.equal(getDefaultWidgetTitle('devtoolbox'), '开发者工具箱');
    assert.deepEqual(getDefaultWidgetData('tasks'), { tasks: [] });
    assert.deepEqual(getDefaultWidgetData('links'), { links: [], viewMode: 'grid' });
    assert.equal(getDefaultWidgetData('pomodoro').timeLeft, 25 * 60);
  });

  await test('migrateStorageData creates default data for invalid input', () => {
    const migrated = migrateStorageData(null);
    assert.equal(migrated.activeTabId, 'default-1');
    assert.equal(migrated.tabs.length, 1);
    assert.equal(migrated.searchEngine, 'baidu');
  });

  await test('migrateStorageData converts old widgets array into columns', () => {
    const migrated = migrateStorageData({
      activeTabId: 'old-tab',
      searchEngine: 'sogou',
      searchEngines: [
        { id: 'sogou', name: 'Sogou', url: 'https://www.sogou.com/web?query=' },
        { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
      ],
      tabs: [
        {
          id: 'old-tab',
          name: '旧标签',
          createdAt: 1,
          widgets: [
            { id: 'legacy-task', type: 'tasks', title: '任务', data: { tasks: [] } },
          ],
        },
      ],
    });

    assert.equal(migrated.activeTabId, 'old-tab');
    assert.equal(migrated.searchEngine, 'bing');
    assert.equal(migrated.searchEngines.some((engine) => engine.id === 'sogou'), false);
    assert.equal(migrated.tabs[0].columns.length, 4);
    assert.equal(migrated.tabs[0].columns[0].widgets[0].id, 'legacy-task');
  });

  await test('storage write queue preserves concurrent mutations', async () => {
    await storage.saveData({
      activeTabId: 'base',
      searchEngine: 'baidu',
      searchEngines: [
        { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
        { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
      ],
      tabs: [
        { id: 'base', name: '首页', columns: [{ id: 'col-1', widgets: [] }], createdAt: 1 },
      ],
    });

    await Promise.all([
      storage.addTab({ id: 'work', name: '工作', columns: [{ id: 'col-work', widgets: [] }], createdAt: 2 }),
      storage.setSearchEngine('bing'),
    ]);

    const data = await storage.getData();
    assert.equal(data.searchEngine, 'bing');
    assert.equal(data.tabs.some((tab) => tab.id === 'work'), true);
  });

  fs.rmSync(compiledRoot, { recursive: true, force: true });
  console.log('tests: all checks passed');
};

main().catch((error) => {
  fs.rmSync(compiledRoot, { recursive: true, force: true });
  throw error;
});
