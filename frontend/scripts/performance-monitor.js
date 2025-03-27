const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const PERFORMANCE_DIR = path.join(__dirname, '../performance-reports');
const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      disable: false,
      width: 1350,
      height: 940,
      deviceScaleRatio: 1,
      disabled: false,
    },
  },
};

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
  };

  try {
    const results = await lighthouse(url, options, LIGHTHOUSE_CONFIG);
    const reportJson = JSON.stringify(results.lhr, null, 2);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(PERFORMANCE_DIR, `lighthouse-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, reportJson);
    console.log(`Lighthouse report saved to ${reportPath}`);
    
    return results.lhr;
  } finally {
    await chrome.kill();
  }
}

async function analyzeBundleSize() {
  const stats = JSON.parse(execSync('next bundle-analyzer').toString());
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(PERFORMANCE_DIR, `bundle-analysis-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
  console.log(`Bundle analysis saved to ${reportPath}`);
  
  return stats;
}

async function checkBuildPerformance() {
  const startTime = Date.now();
  
  execSync('next build', { stdio: 'inherit' });
  
  const endTime = Date.now();
  const buildTime = endTime - startTime;
  
  const report = {
    timestamp: new Date().toISOString(),
    buildTime,
    memoryUsage: process.memoryUsage(),
  };
  
  const reportPath = path.join(PERFORMANCE_DIR, `build-performance-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Build performance report saved to ${reportPath}`);
  return report;
}

async function monitorPerformance() {
  // Create performance reports directory if it doesn't exist
  if (!fs.existsSync(PERFORMANCE_DIR)) {
    fs.mkdirSync(PERFORMANCE_DIR, { recursive: true });
  }
  
  try {
    console.log('Starting performance monitoring...');
    
    // Run Lighthouse audit
    console.log('Running Lighthouse audit...');
    await runLighthouse('http://localhost:3001');
    
    // Analyze bundle size
    console.log('Analyzing bundle size...');
    await analyzeBundleSize();
    
    // Check build performance
    console.log('Checking build performance...');
    await checkBuildPerformance();
    
    console.log('Performance monitoring completed successfully!');
  } catch (error) {
    console.error('Error during performance monitoring:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  monitorPerformance();
}

module.exports = {
  runLighthouse,
  analyzeBundleSize,
  checkBuildPerformance,
  monitorPerformance,
}; 