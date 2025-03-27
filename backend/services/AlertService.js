const { WebClient } = require('@slack/web-api');
const Sentry = require('@sentry/node');
const AlertHistory = require('../models/AlertHistory');

class AlertService {
    constructor() {
        this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
        this.alertChannel = process.env.SLACK_ALERT_CHANNEL;
        this.alertThreshold = parseInt(process.env.ALERT_THRESHOLD) || 3; // Number of consecutive failures before alerting
        this.failureCounts = {};
        this.lastAlertTime = {};
    }

    async sendSlackAlert(component, error, status) {
        try {
            // Initialize failure count if not exists
            if (!this.failureCounts[component]) {
                this.failureCounts[component] = 0;
            }

            // Increment failure count
            this.failureCounts[component]++;

            // Check if we should send an alert
            if (this.failureCounts[component] >= this.alertThreshold) {
                // Check if we've already alerted recently (within last 5 minutes)
                const now = Date.now();
                if (!this.lastAlertTime[component] || (now - this.lastAlertTime[component]) > 5 * 60 * 1000) {
                    const message = this.formatSlackMessage(component, error, status);
                    await this.slack.chat.postMessage({
                        channel: this.alertChannel,
                        text: message,
                        blocks: this.formatSlackBlocks(component, error, status)
                    });

                    // Update last alert time
                    this.lastAlertTime[component] = now;

                    // Store alert history
                    await AlertHistory.create({
                        component,
                        type: 'failure',
                        status,
                        error,
                        environment: process.env.NODE_ENV,
                        metadata: {
                            failureCount: this.failureCounts[component],
                            threshold: this.alertThreshold
                        }
                    });

                    // Log to Sentry if configured
                    if (process.env.SENTRY_DSN) {
                        Sentry.captureMessage(`Health check failed for ${component}`, {
                            level: 'error',
                            extra: {
                                error,
                                status,
                                failureCount: this.failureCounts[component]
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to send Slack alert:', error);
        }
    }

    formatSlackMessage(component, error, status) {
        return `🚨 *Health Check Alert: ${component}*\n` +
               `Status: ${status}\n` +
               `Error: ${error}\n` +
               `Environment: ${process.env.NODE_ENV}\n` +
               `Time: ${new Date().toISOString()}`;
    }

    formatSlackBlocks(component, error, status) {
        return [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `🚨 Health Check Alert: ${component}`,
                    emoji: true
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Status:*\n${status}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Environment:*\n${process.env.NODE_ENV}`
                    }
                ]
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Error:*\n\`\`\`${error}\`\`\``
                }
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `Time: ${new Date().toISOString()}`
                    }
                ]
            }
        ];
    }

    resetFailureCount(component) {
        this.failureCounts[component] = 0;
    }

    async sendRecoveryAlert(component) {
        try {
            const message = `✅ *Health Check Recovered: ${component}*\n` +
                          `The ${component} service has recovered and is now healthy.\n` +
                          `Time: ${new Date().toISOString()}`;

            await this.slack.chat.postMessage({
                channel: this.alertChannel,
                text: message,
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: `✅ Health Check Recovered: ${component}`,
                            emoji: true
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `The ${component} service has recovered and is now healthy.`
                        }
                    },
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'mrkdwn',
                                text: `Time: ${new Date().toISOString()}`
                            }
                        ]
                    }
                ]
            });

            // Store recovery alert history
            await AlertHistory.create({
                component,
                type: 'recovery',
                status: 'healthy',
                environment: process.env.NODE_ENV,
                metadata: {
                    previousFailureCount: this.failureCounts[component]
                }
            });

            this.resetFailureCount(component);
        } catch (error) {
            console.error('Failed to send recovery alert:', error);
        }
    }

    // New methods for alert history
    async getRecentAlerts(limit = 100) {
        return AlertHistory.getRecentAlerts(limit);
    }

    async getComponentAlerts(component, limit = 50) {
        return AlertHistory.getComponentAlerts(component, limit);
    }

    async getAlertsByType(type, limit = 50) {
        return AlertHistory.getAlertsByType(type, limit);
    }

    async getAlertsByTimeRange(startTime, endTime) {
        return AlertHistory.getAlertsByTimeRange(startTime, endTime);
    }

    async getAlertStats() {
        const now = new Date();
        const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

        const [totalAlerts, recentAlerts, failures, recoveries] = await Promise.all([
            AlertHistory.countDocuments(),
            AlertHistory.countDocuments({ timestamp: { $gte: last24Hours } }),
            AlertHistory.countDocuments({ type: 'failure' }),
            AlertHistory.countDocuments({ type: 'recovery' })
        ]);

        return {
            totalAlerts,
            recentAlerts,
            failures,
            recoveries,
            timeRange: {
                start: last24Hours,
                end: now
            }
        };
    }
}

module.exports = new AlertService(); 