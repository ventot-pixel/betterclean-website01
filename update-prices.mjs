/** Synchronise public textile prices and JSON-LD from pricing.js. --check is read-only. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') + '\nthis.card = TEXTILE_RATE_CARD; this.prices = PRICES; this.bundle = TEXTILE_BUNDLE;', ctx);
const { card, prices, bundle } = ctx;
card["Bundle / price"] = { fi: bundle.price + " €", en: bundle.price + " €" };
const saving = bundle.doubleMattress + bundle.sofa3Seat - bundle.price;
if (saving <= 0) throw new Error("Bundle must cost less than its components");
card["Bundle / savings"] = { fi: "Säästä " + saving + " € verrattuna yksittäisiin", en: "Save " + saving + " € vs. individual" };
const base = name => Number(card[name + ' / extraction'].fi.match(/\d+(?:,\d+)?/)[0].replace(',', '.'));
const steam = name => Number(card[name + ' / steam'].fi.match(/\d+(?:,\d+)?/)[0].replace(',', '.'));
const offers = Object.fromEntries(Object.keys(card).filter(key => key.endsWith(' / extraction')).map(key => [key.replace(' / extraction', ''), base(key.replace(' / extraction', ''))]));
offers['Two-seat sofa with steam-assisted treatment'] = steam('Two-seat sofa');
const steamOffers = { 'Single mattress': prices.steamSingleMattress, 'Double mattress, 160 cm': prices.steamDoubleMattress, '2-seat sofa': prices.steamSofa2Seat, '3-seat sofa': steam('Three-seat sofa'), 'Armchair': prices.steamArmchair, 'Bathroom or sauna': prices.steamBathroomSauna };
if (bundle.doubleMattress !== base('Double mattress, 160 cm') || bundle.sofa3Seat !== base('Three-seat sofa')) throw new Error('Bundle components drifted from the textile catalogue');
let changed = false;
for (const file of ['textile-cleaning.html', 'pricing.html', 'steam-cleaning.html']) {
  const filename = path.join(root, file); const original = fs.readFileSync(filename, 'utf8');
  let html = original.replace(/<span (?=[^>]*data-price-key="([^"]+)")[^>]*>.*?<\/span>/g, (match, key) => {
    if (!card[key]) throw new Error('Unknown price: ' + key);
    const cls = match.match(/class="([^"]+)"/)?.[1] || "note";
    return `<span class="${cls}" data-price-key="${key}" data-en="${card[key].en}" data-fi="${card[key].fi}">${card[key].fi}</span>`;
  });
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (_, open, body, close) => {
    JSON.parse(body); // Reject malformed structured data before changing a file.
    const map = file === 'textile-cleaning.html' ? offers : steamOffers;
    return open + body.replace(/("name":\s*"([^"]+)"\s*,\s*"price":\s*")[^"]+(")/g,
      (match, prefix, name, suffix) => Object.hasOwn(map, name) ? prefix + String(map[name]) + suffix : match) + close;
  });
  if (html !== original) {
    changed = true;
    if (process.argv.includes('--check')) console.error(`${file}: prices need synchronisation`);
    else fs.writeFileSync(filename, html);
  }
}
if (process.argv.includes('--check') && changed) process.exitCode = 1;
