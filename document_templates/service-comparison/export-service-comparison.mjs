import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const outputDir = path.join(rootDir, 'output', 'service-comparison');
const baseUrl = process.env.SERVICE_COMPARISON_URL || 'http://localhost:3000/document_templates/service-comparison/index.html';

fs.mkdirSync(outputDir, { recursive: true });

const languages = [
  { lang: 'fi', name: 'betterclean-service-comparison-fi' },
  { lang: 'en', name: 'betterclean-service-comparison-en' },
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const item of languages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.evaluate((lang) => window.setLang(lang), item.lang);
  await page.evaluate(() => document.fonts.ready);

  await page.pdf({
    path: path.join(outputDir, `${item.name}.pdf`),
    printBackground: true,
    preferCSSPageSize: true,
    width: '210mm',
    height: '297mm',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await page.evaluate(() => document.documentElement.classList.add('exporting'));
  await page.waitForFunction(() => document.documentElement.classList.contains('exporting'));

  const sheets = await page.$$eval('.sheet', (nodes) => nodes.map((node, index) => {
    const rect = node.getBoundingClientRect();
    return {
      index: index + 1,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }));

  for (const sheet of sheets) {
    await page.screenshot({
      path: path.join(outputDir, `${item.name}-page-${sheet.index}.png`),
      clip: {
        x: Math.max(0, sheet.x),
        y: Math.max(0, sheet.y),
        width: Math.ceil(sheet.width),
        height: Math.ceil(sheet.height),
      },
    });
  }

  await page.close();
  console.log(`Exported ${item.name}`);
}

await browser.close();
