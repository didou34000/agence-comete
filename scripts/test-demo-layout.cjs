// Run with Playwright available on NODE_PATH. No form submissions or tracking.
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:4174';

(async () => {
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: 'chrome' } : {}) });
    try {
      for (const width of [1440, 1024, 768, 390, 320]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        await page.goto(`${origin}/creation-site-internet`);
        await page.locator('#demos').scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll('#demos img')].every(image => image.complete && image.naturalWidth > 0));
        await page.evaluate(() => document.fonts.ready);
        let baseline;
        for (let pass = 0; pass < 4; pass++) {
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
          await page.locator('#demos').scrollIntoViewIfNeeded();
          await page.waitForTimeout(250);
          const box = await page.evaluate(() => {
            const grid = document.querySelector('.demos').getBoundingClientRect();
            return {
              viewport: innerWidth, page: document.documentElement.scrollWidth,
              grid: { left: grid.left, right: grid.right },
              cards: [...document.querySelectorAll('.demos .travail')].map(card => {
                const rect = card.getBoundingClientRect();
                const visual = card.querySelector('.travail__visuel').getBoundingClientRect();
                return { left: rect.left, right: rect.right, width: visual.width, height: visual.height };
              })
            };
          });
          assert(box.page <= box.viewport + 1, `${name} ${width}px: page overflow ${box.page}`);
          assert.equal(box.cards.length, 5);
          box.cards.forEach((card, index) => {
            assert(card.left >= box.grid.left - 1 && card.right <= box.grid.right + 1, `${name} ${width}px: card ${index} escapes grid`);
            assert(Math.abs(card.width / card.height - (width <= 560 ? 1.6 : 4 / 3)) < .03, 'Wrong image ratio');
            if (baseline) {
              assert(Math.abs(card.width - baseline[index].width) < 1, 'Card grows while scrolling');
              assert(Math.abs(card.height - baseline[index].height) < 1, 'Card height grows while scrolling');
            }
          });
          baseline = box.cards;
        }
        for (const href of await page.locator('.demos a').evaluateAll(links => links.map(link => link.href))) {
          assert((await page.request.get(href)).ok(), `Broken demo: ${href}`);
        }
        if (width === 1440 || width === 390) await page.screenshot({ path: `/tmp/agence-demo-${name}-${width}.png` });
        console.log(`PASS ${name} ${width}px: stable cards, no overflow, five working demo links`);
        await page.close();
      }
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
