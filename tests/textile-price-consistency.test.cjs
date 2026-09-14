const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(read('pricing.js') + '\nthis.card=TEXTILE_RATE_CARD;this.p=PRICES;this.b=TEXTILE_BUNDLE;', ctx);
const amount = label => Number(ctx.card[label].fi.match(/\d+(?:,\d+)?/)[0].replace(',', '.'));
function offers(file) {
  const found = [];
  function walk(o) { if (!o || typeof o !== 'object') return; if (o['@type'] === 'Offer') found.push(o); Object.values(o).forEach(walk); }
  for (const m of read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) walk(JSON.parse(m[1]));
  return found;
}
test('public textile rendering is synchronised with the canonical catalogue', () => {
  execFileSync(process.execPath, ['update-prices.mjs', '--check'], { cwd: root });
  for (const [label, constant] of [['Armchair', 'steamArmchair'], ['Two-seat sofa', 'steamSofa2Seat'], ['Double mattress, 160 cm', 'steamDoubleMattress'], ['Single mattress, 80-90 cm', 'steamSingleMattress']]) assert.equal(amount(label + ' / steam'), ctx.p[constant], label);
  assert.equal(amount('Three-seat sofa / steam'), ctx.p.steamSofa2Seat + ctx.p.steamSofaExtraSeat);
});
test('sofa and armchair extraction offers match visible prices and both steam pages', () => {
  const textile = offers('textile-cleaning.html');
  for (const name of ['Armchair', 'Two-seat sofa', 'Three-seat sofa']) assert.equal(Number(textile.find(o => o.name === name).price), amount(name + ' / extraction'));
  for (const file of ['pricing.html', 'steam-cleaning.html']) {
    const list = offers(file);
    for (const [name, label] of [['Armchair','Armchair'], ['2-seat sofa','Two-seat sofa'], ['3-seat sofa','Three-seat sofa'], ['Double mattress, 160 cm','Double mattress, 160 cm']]) assert.equal(Number(list.find(o => o.name === name).price), amount(label + ' / steam'), file + ': ' + name);
  }
});
test('149 euro bundle has defined components and a real 29 euro saving', () => {
  assert.equal(ctx.b.doubleMattress, amount('Double mattress, 160 cm / extraction'));
  assert.equal(ctx.b.sofa3Seat, amount('Three-seat sofa / extraction'));
  assert.equal(ctx.b.doubleMattress + ctx.b.sofa3Seat - ctx.b.price, 29);
  const html = read('pricing.html');
  assert.match(html, /Bundle: 160 cm Mattress \+ 3-seat Sofa/);
  assert.match(html, /Extraction of both items; steam and protection excluded/);
  assert.doesNotMatch(html, /pkg-price">(?:249 €|€300|€620|€480)/);
  assert.doesNotMatch(html, /Save €(?:25|55) vs/);
});
test('base extraction and included HEPA do not advertise contradictory extra charges', () => {
  const html = read('pricing.html');
  const section = html.slice(html.indexOf('<!-- ── EXTRACTION & UPHOLSTERY'), html.indexOf('data-en="Additional Services"'));
  assert.doesNotMatch(section, /Fabric protection treatment included|Steam pre-treatment, extraction|protector coat/);
  for (const file of ['pricing.html','post-renovation-cleaning.html']) assert.doesNotMatch(read(file), /HEPA filtration upgrade|HEPA-suodatusparannus/);
  assert.doesNotMatch(read('textile-cleaning.html'), /<span class="market-price"|Usual local price|Typical local range/);
  assert.match(read('textile-cleaning.html'), /200 x 300 cm standard carpet: 69 €, premium 77.40 €/);
});
test('legacy asset price list points to the current tariff without publishing old prices', () => {
  assert.doesNotMatch(read('brand_assets/premium_pricing.html'), /€|"price"\s*:/);
  assert.match(read('brand_assets/premium_pricing.html'), /href="\/pricing.html"/);
  const config = JSON.parse(read('vercel.json'));
  assert.ok(config.redirects.some(r => r.source === '/brand_assets/premium_pricing.html' && r.destination === '/pricing.html' && r.permanent));
});
