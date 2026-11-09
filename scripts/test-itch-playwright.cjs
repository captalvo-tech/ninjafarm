const { chromium } = require('Z:/AI/node_modules/playwright');

async function checkP(url) {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.click('a.direct_download_btn');
  await page.waitForTimeout(2000);
  const uploads = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.upload')).map(u => ({
      name: u.querySelector('.upload_name')?.innerText?.trim(),
      filesize: u.querySelector('.file_size')?.innerText?.trim(),
      btn: u.querySelector('a.download_btn')?.getAttribute('data-upload_id')
    }));
  });
  console.log('Uploads for', url, uploads);
  await browser.close();
}

checkP('https://quaternius.itch.io/lowpoly-farm-buildings/purchase').catch(console.error);
