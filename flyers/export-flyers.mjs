import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'output', 'flyers');

fs.mkdirSync(outputDir, { recursive: true });

const flyers = [
  { id: 'textile-fi', name: 'betterclean-textile-cleaning-fi' },
  { id: 'textile-en', name: 'betterclean-textile-cleaning-en' },
  { id: 'window-fi', name: 'betterclean-window-cleaning-fi' },
  { id: 'window-en', name: 'betterclean-window-cleaning-en' },
];

const baseUrl = process.env.FLYER_BASE_URL || 'http://localhost:3000/flyers/betterclean-flyers.html';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const flyer of flyers) {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.goto(`${baseUrl}?flyer=${flyer.id}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const flyerBox = await page.$eval(`#${flyer.id}`, (node) => {
    const rect = node.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  });

  await page.screenshot({
    path: path.join(outputDir, `${flyer.name}.png`),
    clip: {
      x: Math.max(0, flyerBox.x),
      y: Math.max(0, flyerBox.y),
      width: Math.ceil(flyerBox.width),
      height: Math.ceil(flyerBox.height),
    },
  });

  await page.pdf({
    path: path.join(outputDir, `${flyer.name}.pdf`),
    printBackground: true,
    preferCSSPageSize: true,
    width: '210mm',
    height: '297mm',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await page.close();
  console.log(`Exported ${flyer.name}`);
}

await browser.close();
