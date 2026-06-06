const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const sourceFiles = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      sourceFiles.push(fullPath);
    }
  }
};

walk(srcDir);

const rules = [
  {
    name: 'no-explicit-any',
    pattern: /(^|[^\w])(:\s*any\b|as\s+any\b|catch\s*\([^)]*:\s*any\))/,
    message: 'Avoid explicit any. Add a domain type or use unknown with narrowing.',
  },
  {
    name: 'no-debugger',
    pattern: /\bdebugger\b/,
    message: 'Remove debugger statements before committing.',
  },
  {
    name: 'no-dangerous-html',
    pattern: /\bdangerouslySetInnerHTML\b/,
    message: 'dangerouslySetInnerHTML is not allowed in the extension UI.',
  },
];

const failures = [];

for (const file of sourceFiles) {
  const relative = path.relative(rootDir, file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    rules.forEach((rule) => {
      if (rule.pattern.test(line)) {
        failures.push(`${relative}:${index + 1} ${rule.name} - ${rule.message}`);
      }
    });
  });
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`lint: checked ${sourceFiles.length} source files`);
