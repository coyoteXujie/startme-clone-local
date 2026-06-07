const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const compiledRoot = path.join(rootDir, '.tmp-tests');

const { buildSearchUrl, normalizeHttpUrl } = require('../.tmp-tests/src/utils/url.js');
const { getDefaultWidgetData, getDefaultWidgetTitle } = require('../.tmp-tests/src/utils/widgetDefaults.js');
const { moveWidgetInTabs } = require('../.tmp-tests/src/utils/widgetDrag.js');
const { migrateStorageData, storage } = require('../.tmp-tests/src/utils/storage.js');
const { createWidgetId, createFeedId, createTaskId, createLinkId, createToastId } = require('../.tmp-tests/src/utils/id.js');
const { createWriteQueue } = require('../.tmp-tests/src/utils/writeQueue.js');

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

const createTaskWidget = (id) => ({
  id,
  type: 'tasks',
  title: id,
  data: { tasks: [] },
});

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

  await test('moveWidgetInTabs reorders widgets inside the same column', () => {
    const tabs = [
      {
        id: 'tab-1',
        name: '首页',
        createdAt: 1,
        columns: [
          { id: 'col-1', widgets: [createTaskWidget('a'), createTaskWidget('b'), createTaskWidget('c')] },
        ],
      },
    ];

    const nextTabs = moveWidgetInTabs({
      tabs,
      dragData: { tabId: 'tab-1', widgetId: 'a', sourceColumnId: 'col-1' },
      targetColumnId: 'col-1',
      targetIndex: 3,
    });

    assert.deepEqual(nextTabs[0].columns[0].widgets.map((widget) => widget.id), ['b', 'c', 'a']);
    assert.deepEqual(tabs[0].columns[0].widgets.map((widget) => widget.id), ['a', 'b', 'c']);
  });

  await test('moveWidgetInTabs moves widgets across columns', () => {
    const tabs = [
      {
        id: 'tab-1',
        name: '首页',
        createdAt: 1,
        columns: [
          { id: 'col-1', widgets: [createTaskWidget('a'), createTaskWidget('b')] },
          { id: 'col-2', widgets: [createTaskWidget('c')] },
        ],
      },
    ];

    const nextTabs = moveWidgetInTabs({
      tabs,
      dragData: { tabId: 'tab-1', widgetId: 'b', sourceColumnId: 'col-1' },
      targetColumnId: 'col-2',
      targetIndex: 0,
    });

    assert.deepEqual(nextTabs[0].columns[0].widgets.map((widget) => widget.id), ['a']);
    assert.deepEqual(nextTabs[0].columns[1].widgets.map((widget) => widget.id), ['b', 'c']);
  });

  await test('migrateStorageData creates default data for invalid input', () => {
    const migrated = migrateStorageData(null);
    assert.equal(migrated.activeTabId, 'default-1');
    assert.equal(migrated.tabs.length, 1);
    assert.equal(migrated.searchEngine, 'baidu');
    assert.equal(migrated.schemaVersion, 2);
  });

  await test('migrateStorageData converts old widgets array into columns', () => {
    const migrated = migrateStorageData({
      schemaVersion: 1,
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
    assert.equal(migrated.schemaVersion, 2);
  });

  await test('migrateStorageData 过滤非法小组件并补齐列数量', () => {
    const migrated = migrateStorageData({
      schemaVersion: 0,
      activeTabId: 'invalid-tab',
      searchEngine: 'sogou',
      tabs: [
        {
          id: 'legacy-tab',
          name: '旧版页签',
          columns: [
            {
              id: 'legacy-col',
              widgets: [
                { id: 'legacy-task', type: 'tasks', title: '合法任务', data: { tasks: [] } },
                { id: 'bad-widget', type: 'ghost', title: '非法', data: {} },
              ],
            },
          ],
        },
      ],
      searchEngines: [
        { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com' },
        { id: 'baidu', name: 'Baidu2', url: 'https://www.baidu.com' },
      ],
    });

    assert.equal(migrated.tabs[0].columns.length, 4);
    assert.equal(migrated.tabs[0].columns[0].widgets.length, 1);
    assert.equal(migrated.tabs[0].columns[0].widgets[0].type, 'tasks');
    assert.equal(migrated.tabs[0].columns[0].widgets[0].id, 'legacy-task');
    assert.equal(migrated.tabs[0].columns[0].widgets.every((widget) => widget.id !== 'bad-widget'), true);
    assert.equal(migrated.searchEngine, migrated.searchEngines[0].id);
    assert.equal(migrated.searchEngines.length, 1);
    assert.equal(migrated.schemaVersion, 2);
  });

  await test('migrateStorageData 会修复旧版本字段与非法搜索引擎 URL', () => {
    const migrated = migrateStorageData({
      schemaVersion: 1,
      activeTabId: 'legacy-tab',
      searchEngine: 'engine-old',
      tabs: [
        {
          id: 'legacy-tab',
          name: '旧版',
          columns: [
            {
              id: 'legacy-col',
              widgets: [
                { id: 'legacy-rss', type: 'rss', title: '新闻', data: { feeds: [] } },
              ],
            },
          ],
        },
      ],
      searchEngines: [
        { id: 'engine-old', name: '旧引擎', url: 'javascript:alert(1)' },
        { id: 'engine-new', name: '新引擎', url: 'example.com/search?q=' },
      ],
    });

    assert.equal(migrated.schemaVersion, 2);
    assert.equal(migrated.searchEngine, 'engine-new');
    assert.equal(migrated.searchEngines.length, 1);
    assert.equal(migrated.searchEngines[0].id, 'engine-new');
    assert.equal(migrated.searchEngines[0].url, 'https://example.com/search?q=');
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

  await test('setSearchEngine ignores non-existent engine', async () => {
    await storage.saveData({
      activeTabId: 'base',
      searchEngine: 'baidu',
      searchEngines: [
        { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
      ],
      tabs: [{ id: 'base', name: '首页', columns: [{ id: 'col-1', widgets: [] }], createdAt: 1 }],
    });

    await storage.setSearchEngine('invalid');
    const data = await storage.getData();
    assert.equal(data.searchEngine, 'baidu');
  });

  await test('write queue runs tasks serially and waitForIdle works', async () => {
    const queue = createWriteQueue();
    const order = [];

    const p1 = queue.enqueue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push('first');
      return 'first';
    });
    const p2 = queue.enqueue(async () => {
      order.push('second');
      return 'second';
    });
    const p3 = queue.enqueue(async () => {
      order.push('third');
      return 'third';
    });

    await Promise.all([p1, p2, p3]);
    assert.deepEqual(order, ['first', 'second', 'third']);
    await queue.waitForIdle();
    assert.equal(queue.getState().pending, 0);
  });

  await test('write queue keeps order after failed task', async () => {
    const queue = createWriteQueue();
    const order = [];
    let firstFailed = false;

    const p1 = queue.enqueue(async () => {
      order.push('first');
      throw new Error('boom');
    });
    const p2 = queue.enqueue(async () => {
      order.push('second');
      return 'second';
    });

    try {
      await p1;
      throw new Error('预期抛错任务应失败');
    } catch (error) {
      firstFailed = error instanceof Error;
    }

    await p2;
    assert.equal(firstFailed, true);
    assert.deepEqual(order, ['first', 'second']);
    await queue.waitForIdle();
    assert.equal(queue.getState().pending, 0);
  });

  await test('id helpers generate stable prefixes', () => {
    assert.equal(createWidgetId().startsWith('widget-'), true);
    assert.equal(createFeedId().startsWith('rss-'), true);
    assert.equal(createTaskId().startsWith('task-'), true);
    assert.equal(createLinkId().startsWith('link-'), true);
    assert.equal(createToastId().startsWith('toast-'), true);
  });

  fs.rmSync(compiledRoot, { recursive: true, force: true });
  console.log('tests: all checks passed');
};

main().catch((error) => {
  fs.rmSync(compiledRoot, { recursive: true, force: true });
  throw error;
});
