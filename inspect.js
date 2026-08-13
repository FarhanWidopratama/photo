const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push({type: msg.type(), text: msg.text()});
    }
  });
  page.on('pageerror', err => errors.push({type:'pageerror', text: err.message}));
  page.on('requestfailed', req => errors.push({type:'requestfailed', url: req.url(), status: req.failure().errorText}));
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0', timeout: 20000 });
  await page.waitForTimeout(2000);
  const content = await page.content();
  console.log('content snippet:', content.slice(0, 800));
  console.log('errors:', JSON.stringify(errors, null, 2));
  await browser.close();
})();
