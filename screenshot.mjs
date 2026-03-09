import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

// Find next N
const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-'));
let max = 0;
existing.forEach(f => {
  const m = f.match(/screenshot-(\d+)/);
  if (m) max = Math.max(max, parseInt(m[1]));
});
const n = max + 1;
const filename = path.join(dir, `screenshot-${n}${label}.png`);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.screenshot({ path: filename, fullPage: true });
await browser.close();

console.log(`Saved: ${filename}`);
