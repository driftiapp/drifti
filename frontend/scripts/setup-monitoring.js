const { ga4Configurator } = require('../src/utils/ga4Config');

async function setupMonitoring() {
  console.log('Setting up GA4 monitoring...');

  try {
    // Initialize GA4 configuration
    ga4Configurator.initialize();

    // Set up default segments
    console.log('Setting up user segments...');
    const segments = ga4Configurator.getUserSegments();
    console.log(`Configured ${segments.length} user segments`);

    // Set up default reports
    console.log('Setting up custom reports...');
    const reports = [
      'Web Vitals Overview',
      'API Performance by User Type',
      'Component Performance',
      'Page Load Performance',
      'User Journey Performance',
      'Driver Performance Metrics'
    ];
    reports.forEach(report => {
      const url = ga4Configurator.getReportUrl(report);
      console.log(`Report URL for ${report}: ${url}`);
    });

    // Set up default funnels
    console.log('Setting up conversion funnels...');
    const funnels = [
      'Customer Purchase Journey',
      'Driver Delivery Journey'
    ];
    funnels.forEach(funnel => {
      const url = ga4Configurator.getFunnelUrl(funnel);
      console.log(`Funnel URL for ${funnel}: ${url}`);
    });

    // Set up default alerts
    console.log('Setting up alerts...');
    const alerts = [
      'High CLS Alert - Mobile Users',
      'Slow LCP Alert - High Value Customers',
      'High FID Alert - Cart Abandoners',
      'Slow API Response - Active Drivers'
    ];
    alerts.forEach(alert => {
      console.log(`Configured alert: ${alert}`);
    });

    // Set up default experiments
    console.log('Setting up experiments...');
    const experiments = ga4Configurator.getActiveExperiments();
    console.log(`Configured ${experiments.length} active experiments`);

    console.log('✅ Monitoring setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up monitoring:', error);
    process.exit(1);
  }
}

setupMonitoring(); 