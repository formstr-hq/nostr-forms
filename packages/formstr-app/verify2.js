const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch();
  for (const width of [1280, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
    await page.waitForSelector(".header-style", { timeout: 30000 });
    await page.waitForTimeout(1500);
    const d = await page.evaluate(() => {
      const b = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
        return { x: +r.x.toFixed(1), midY: +(r.y + r.height/2).toFixed(1) }; };
      const q = (s) => document.querySelector(s);
      return {
        logo: b(q(".app-link svg")),
        create: b(q(".header-create-btn")),
        bellBtn: b(q(".header-actions .ant-space-item:nth-child(2) button")),
        userBtn: b(q(".header-actions .ant-space-item:nth-child(3) button")),
        contentLeft: q(".app-container")?.firstElementChild ? +q(".app-container").firstElementChild.getBoundingClientRect().x.toFixed(1) : null,
        hOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    console.log(`w=${width}`, JSON.stringify(d));
    await page.close();
  }
  await browser.close();
})();
