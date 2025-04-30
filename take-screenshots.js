const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Home page
    console.log('Taking screenshot of home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-home.png') });
    
    // Login page
    console.log('Taking screenshot of login page...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '02-login.png') });
    
    // Signup page
    console.log('Taking screenshot of signup page...');
    await page.goto('http://localhost:3000/auth/signup', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '03-signup.png') });
    
    // Try to login as a demo user
    console.log('Attempting to login as demo user...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'user@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {
      console.log('Navigation timeout - continuing anyway');
    });
    
    // Dashboard page (if login successful)
    console.log('Taking screenshot of dashboard page...');
    await page.screenshot({ path: path.join(screenshotsDir, '04-dashboard.png') });
    
    console.log('Screenshots saved to', screenshotsDir);
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);
