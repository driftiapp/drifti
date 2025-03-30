const { ga4Configurator } = require('../src/utils/ga4Config');

async function setupAlerts() {
  console.log('Setting up GA4 alerts...');

  try {
    // Set up smart alerts
    console.log('Setting up smart alerts...');
    const smartAlerts = [
      {
        name: 'Adaptive FID Alert',
        metric: 'web_vital_fid',
        threshold: 100,
        operator: '>',
        window: 5,
        notificationChannels: ['slack'],
        segments: ['Mobile Users'],
        adaptiveThreshold: {
          baselineWindow: 1440,
          deviationThreshold: 50,
          minSampleSize: 100,
        },
        notificationTargets: {
          slack: ['#perf-alerts', '#mobile-team'],
          email: ['performance@drifti.com'],
        },
      },
      {
        name: 'Smart API Response Alert',
        metric: 'perf_api_request_duration',
        threshold: 1000,
        operator: '>',
        window: 5,
        notificationChannels: ['slack', 'email'],
        segments: ['High Value Customers', 'Active Drivers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 100,
          minSampleSize: 50,
        },
        notificationTargets: {
          slack: ['#api-alerts'],
          email: ['api-team@drifti.com'],
        },
      },
      {
        name: 'Server Resource Alert',
        metric: 'server_cpu_usage',
        threshold: 80,
        operator: '>',
        window: 5,
        notificationChannels: ['slack', 'email'],
        segments: ['High Value Customers', 'Active Drivers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 30,
          minSampleSize: 20,
        },
        notificationTargets: {
          slack: ['#server-alerts'],
          email: ['devops@drifti.com'],
        },
      },
      {
        name: 'API Error Rate Alert',
        metric: 'api_error_rate',
        threshold: 5,
        operator: '>',
        window: 5,
        notificationChannels: ['slack', 'email', 'sms'],
        segments: ['High Value Customers', 'Active Drivers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 200,
          minSampleSize: 20,
        },
        notificationTargets: {
          slack: ['#error-alerts'],
          email: ['error-team@drifti.com'],
          sms: ['+1234567890'],
        },
      },
      {
        name: 'Cache Performance Alert',
        metric: 'cache_hit_rate',
        threshold: 70,
        operator: '<',
        window: 5,
        notificationChannels: ['slack', 'email'],
        segments: ['High Value Customers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 20,
          minSampleSize: 20,
        },
        notificationTargets: {
          slack: ['#cache-alerts'],
          email: ['cache-team@drifti.com'],
        },
      },
    ];

    // Configure each alert
    smartAlerts.forEach(alert => {
      console.log(`Configuring alert: ${alert.name}`);
      ga4Configurator.createSmartAlert(alert);
    });

    // Verify alert configuration
    console.log('Verifying alert configuration...');
    const alerts = ga4Configurator.getSmartAlerts();
    console.log(`Successfully configured ${alerts.length} alerts`);

    console.log('✅ Alerts setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up alerts:', error);
    process.exit(1);
  }
}

setupAlerts(); 