import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });

  console.log('Navigating to https://pulse-throttle.vercel.app/...');
  await page.goto('https://pulse-throttle.vercel.app/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Check current theme and ensure Dark Mode
  await page.evaluate(() => {
    localStorage.setItem('pulsethrottle_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 1: Dark Mode Telemetry Dashboard
  const p1 = path.join(SCREENSHOT_DIR, 'dashboard_dark.png');
  await page.screenshot({ path: p1, fullPage: false });
  console.log('Saved:', p1);

  // Click on "View Full Telemetry Breakdown" accordion if available
  try {
    const accordionBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && b.textContent.includes('Telemetry Breakdown')) || null;
    });
    if (accordionBtn) {
      await accordionBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      const p2 = path.join(SCREENSHOT_DIR, 'telemetry_breakdown_dark.png');
      await page.screenshot({ path: p2, fullPage: false });
      console.log('Saved:', p2);
    }
  } catch (err) {
    console.log('Accordion click skipped:', err.message);
  }

  // Screenshot 3: Leaderboard & Database Tab
  try {
    const leaderboardTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && b.textContent.includes('Database & Leaderboard')) || null;
    });
    if (leaderboardTab) {
      await leaderboardTab.click();
      await new Promise(r => setTimeout(r, 2000));
      const p3 = path.join(SCREENSHOT_DIR, 'leaderboard_dark.png');
      await page.screenshot({ path: p3, fullPage: false });
      console.log('Saved:', p3);
    }
  } catch (err) {
    console.log('Leaderboard tab click error:', err.message);
  }

  // Screenshot 4: Light Mode Dashboard
  try {
    const telemetryTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && b.textContent.includes('Hardware Telemetry')) || null;
    });
    if (telemetryTab) {
      await telemetryTab.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    await page.evaluate(() => {
      localStorage.setItem('pulsethrottle_theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await new Promise(r => setTimeout(r, 1500));
    const p4 = path.join(SCREENSHOT_DIR, 'dashboard_light.png');
    await page.screenshot({ path: p4, fullPage: false });
    console.log('Saved:', p4);
  } catch (err) {
    console.log('Light mode toggle error:', err.message);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
