const { execSync } = require('child_process');
const { monitorPerformance } = require('./performance-monitor');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../.next');
const PERFORMANCE_DIR = path.join(__dirname, '../performance-reports');
const SECURITY_DIR = path.join(__dirname, '../security-reports');

async function runSecurityChecks() {
  console.log('Running security checks...');
  
  // Run OWASP ZAP scan if available
  try {
    execSync('zap-cli quick-scan --self-contained --start-options "-config api.disablekey=true" http://localhost:3001', {
      stdio: 'inherit'
    });
  } catch (error) {
    console.warn('OWASP ZAP scan failed or not available:', error.message);
  }
  
  // Run dependency security audit
  try {
    execSync('npm audit', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Dependency security audit failed:', error.message);
  }
  
  // Create security report
  const securityReport = {
    timestamp: new Date().toISOString(),
    headers: fs.readFileSync(path.join(BUILD_DIR, 'server/pages/_document.js'), 'utf8')
      .match(/securityHeaders\s*=\s*\[([\s\S]*?)\]/)[1],
    dependencies: JSON.parse(execSync('npm list --json').toString()),
  };
  
  const reportPath = path.join(SECURITY_DIR, `security-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(securityReport, null, 2));
  
  console.log(`Security report saved to ${reportPath}`);
  return securityReport;
}

async function runBuildProcess() {
  console.log('Starting automated build process...');
  
  // Create necessary directories
  [PERFORMANCE_DIR, SECURITY_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  try {
    // Clean previous builds
    console.log('Cleaning previous builds...');
    execSync('npm run clean:all', { stdio: 'inherit' });
    
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Run type checking
    console.log('Running type checks...');
    execSync('npm run type-check', { stdio: 'inherit' });
    
    // Run linting
    console.log('Running linting...');
    execSync('npm run lint', { stdio: 'inherit' });
    
    // Run tests
    console.log('Running tests...');
    execSync('npm test', { stdio: 'inherit' });
    
    // Build the application
    console.log('Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Start the development server for testing
    console.log('Starting development server...');
    const server = execSync('npm run dev', { stdio: 'pipe' });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run performance monitoring
    console.log('Running performance monitoring...');
    await monitorPerformance();
    
    // Run security checks
    console.log('Running security checks...');
    await runSecurityChecks();
    
    // Kill the development server
    server.kill();
    
    console.log('Build process completed successfully!');
  } catch (error) {
    console.error('Build process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runBuildProcess();
}

module.exports = {
  runBuildProcess,
  runSecurityChecks,
}; 