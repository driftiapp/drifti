const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./rotate-secrets.config');
const { generateSecureSecret, validateSecret, validateConfig } = require('./validate-secrets');
const BackupManager = require('./BackupManager');

// Function to read .env file
function readEnvFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error('Error reading .env file:', error.message);
        return '';
    }
}

// Function to write .env file
function writeEnvFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content);
        return true;
    } catch (error) {
        console.error('Error writing .env file:', error.message);
        return false;
    }
}

// Function to update a secret in .env content
function updateSecret(envContent, key, newValue) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
        return envContent.replace(regex, `${key}=${newValue}`);
    }
    return `${envContent}\n${key}=${newValue}`;
}

// Function to create backup of current secrets
function createBackup(envContent) {
    if (!config.rollback.enabled) return null;

    const backupDir = config.rollback.backupPath;
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `secrets-${timestamp}.env`);

    try {
        fs.writeFileSync(backupPath, envContent);
        return backupPath;
    } catch (error) {
        console.error('Error creating backup:', error.message);
        return null;
    }
}

// Function to send Slack notification
async function sendSlackNotification(message) {
    if (!config.notifications.enabled || !config.notifications.slack.webhookUrl) return;

    try {
        const response = await fetch(config.notifications.slack.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel: config.notifications.slack.channel,
                text: message
            })
        });

        if (!response.ok) {
            throw new Error(`Slack API responded with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending Slack notification:', error.message);
    }
}

// Function to send email notification
async function sendEmailNotification(subject, message) {
    if (!config.notifications.enabled || !config.notifications.email.smtpHost) return;

    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: config.notifications.email.smtpHost,
            port: config.notifications.email.smtpPort,
            auth: {
                user: config.notifications.email.smtpUser,
                pass: config.notifications.email.smtpPass
            }
        });

        await transporter.sendMail({
            from: config.notifications.email.fromEmail,
            to: config.notifications.email.toEmail,
            subject,
            text: message
        });
    } catch (error) {
        console.error('Error sending email notification:', error.message);
    }
}

// Function to update deployment platform secrets
async function updateDeploymentSecrets(secrets) {
    if (config.deployment.platform === 'none') return true;

    try {
        switch (config.deployment.platform) {
            case 'firebase':
                // Update Firebase secrets
                Object.entries(secrets).forEach(([key, value]) => {
                    execSync(`firebase functions:config:set ${key}="${value}"`, { stdio: 'inherit' });
                });
                break;

            case 'render':
                // Update Render secrets
                Object.entries(secrets).forEach(([key, value]) => {
                    execSync(`render secrets set ${key}="${value}"`, { stdio: 'inherit' });
                });
                break;

            case 'railway':
                // Update Railway secrets
                Object.entries(secrets).forEach(([key, value]) => {
                    execSync(`railway variables set ${key}="${value}"`, { stdio: 'inherit' });
                });
                break;

            default:
                console.warn(`Unsupported deployment platform: ${config.deployment.platform}`);
                return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating deployment secrets:', error.message);
        return false;
    }
}

// Function to restart application
function restartApplication() {
    if (!config.restart.enabled) return;

    try {
        console.log(`Restarting application in ${config.restart.delay}ms...`);
        setTimeout(() => {
            execSync(config.restart.command, { stdio: 'inherit' });
        }, config.restart.delay);
    } catch (error) {
        console.error('Error restarting application:', error.message);
    }
}

// Initialize backup manager
const backupManager = new BackupManager(config);

// Main rotation function
async function rotateSecrets() {
    console.log('🔄 Starting secret rotation process...');

    // Create backup before rotation
    console.log('📦 Creating backup of current secrets...');
    const backupPath = await backupManager.createBackup();
    if (!backupPath) {
        console.error('❌ Failed to create backup');
        process.exit(1);
    }
    console.log(`✅ Backup created: ${backupPath}`);

    // Generate new secrets
    console.log('🔑 Generating new secrets...');
    const secrets = generateSecrets();
    if (!secrets) {
        console.error('❌ Failed to generate new secrets');
        process.exit(1);
    }

    // Update deployment platform
    console.log('🚀 Updating deployment platform...');
    const deploymentSuccess = await updateDeploymentSecrets(secrets);
    if (!deploymentSuccess) {
        console.error('❌ Failed to update deployment platform');
        console.log('🔄 Rolling back to previous secrets...');
        await backupManager.restoreBackup(backupPath);
        process.exit(1);
    }

    // Send notifications
    const timestamp = new Date().toISOString();
    const notificationMessage = `🔄 Secrets rotated at ${timestamp}\n\n` +
        Object.entries(secrets)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n') +
        `\n\nBackup created: ${backupPath}`;

    await sendSlackNotification(notificationMessage);
    await sendEmailNotification('Secrets Rotated', notificationMessage);

    console.log('✅ Secret rotation completed successfully');
    console.log('\n🔑 New secret values:');
    Object.entries(secrets).forEach(([key, value]) => {
        console.log(`${key}=${value}`);
    });
}

// Run the script
rotateSecrets().catch(console.error); 