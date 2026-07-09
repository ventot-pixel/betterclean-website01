const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const guidePath = path.join(root, 'internal', 'cleaning-duration-guide', 'index.html');
const guideHtml = fs.readFileSync(guidePath, 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

assert.match(
  guideHtml,
  /<meta name="robots" content="noindex, nofollow, noarchive" \/>/,
  'internal guide has noindex/nofollow/noarchive metadata'
);

assert.match(
  guideHtml,
  /const regularMaintenanceRows = \[/,
  'regular maintenance data is stored as a structured array'
);

assert.match(
  guideHtml,
  /const firstTimeRows = \[/,
  'first-time cleaning data is stored as a structured array'
);

assert.match(
  guideHtml,
  /const deepSteamRows = \[/,
  'Deep Steam data is stored as a structured array'
);

assert.match(
  guideHtml,
  /const adjustmentRows = \[/,
  'adjustment data is stored as a structured array'
);

assert.match(
  guideHtml,
  /window\.print\(\)/,
  'internal guide has a print guide button'
);

assert.doesNotMatch(
  guideHtml,
  /<(nav|footer)\b/i,
  'internal guide does not include public navigation or footer chrome'
);

assert.match(
  guideHtml,
  /Inspection or customised quotation/,
  'Deep Steam large-home inspection row is present'
);

assert.match(
  guideHtml,
  /className = 'highlight-row'/,
  'final Deep Steam row is highlighted'
);

assert.match(
  guideHtml,
  /Person-hours represent the total amount of labour/,
  'person-hours terminology is explained near the top'
);

assert.doesNotMatch(
  sitemap,
  /cleaning-duration-guide/,
  'internal guide is excluded from the sitemap'
);

assert(
  vercelConfig.rewrites.some(rewrite =>
    rewrite.source === '/internal/cleaning-duration-guide' &&
    rewrite.destination === '/internal/cleaning-duration-guide/index.html'
  ),
  'Vercel exposes the discreet extensionless internal route'
);

const publicHtmlFiles = fs.readdirSync(root)
  .filter(file => file.endsWith('.html'));

for (const file of publicHtmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.doesNotMatch(
    html,
    /internal\/cleaning-duration-guide/,
    `${file} does not link to the internal guide`
  );
}
