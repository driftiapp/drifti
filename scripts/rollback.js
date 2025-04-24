#!/usr/bin/env node

const path = require('path');
const { program } = require('commander');
const BackupManager = require('./backup-manager');
const config = require('./rotate-secrets.config');
const { updateDeploymentSecrets } = require('./rotate-secrets');
const { sendSlackNotification, sendEmailNotification } = require('./rotate-secrets');

// Initialize backup manager
const backupManager = new BackupManager(config);

// List available backups
async function listBackups() {
    console.log('📋 Available backups:');
    const backups = await backupManager.listBackups();

    if (backups.length === 0) {
        console.log('No backups found.');
        return;
    }

    backups.forEach((backup, index) => {
        console.log(`\n${index + 1}. ${backup.filename}`);
        console.log(`   Created: ${backup.created.toLocaleString()}`);
        console.log(`   Size: ${(backup.size / 1024).toFixed(2)} KB`);
    });
}

// Verify a specific backup
async function verifyBackup(backupPath) {
    console.log(`🔍 Verifying backup: ${backupPath}`);
    const isValid = await backupManager.verifyBackup(backupPath);

    if (isValid) {
        console.log('✅ Backup is valid and can be restored');
    } else {
        console.error('❌ Backup verification failed');
        process.exit(1);
    }
}

// Restore from a specific backup
async function restoreBackup(backupPath) {
    console.log(`🔄 Restoring from backup: ${backupPath}`);

    // Verify backup first
    const isValid = await backupManager.verifyBackup(backupPath);
    if (!isValid) {
        console.error('❌ Cannot restore from invalid backup');
        process.exit(1);
    }

    // Restore secrets
    const secrets = await backupManager.restoreBackup(backupPath);
    if (!secrets) {
        console.error('❌ Failed to restore secrets');
        process.exit(1);
    }

    // Update deployment platform
    const deploymentSuccess = await updateDeploymentSecrets(secrets);

    // Send notifications
    const timestamp = new Date().toISOString();
    const notificationMessage = `🔄 Secrets restored from backup at ${timestamp}\n\n` +
        Object.entries(secrets)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n') +
        `\n\nDeployment update: ${deploymentSuccess ? '✅' : '❌'}`;

    await sendSlackNotification(notificationMessage);
    await sendEmailNotification('Secrets Restored from Backup', notificationMessage);

    console.log('✅ Secrets restored successfully');
    console.log('\n🔑 Restored secret values:');
    Object.entries(secrets).forEach(([key, value]) => {
        console.log(`${key}=${value}`);
    });
}

// Clean up old backups
async function cleanupBackups(days) {
    console.log(`🧹 Cleaning up backups older than ${days} days`);
    await backupManager.cleanupBackups(days * 24 * 60 * 60 * 1000);
    console.log('✅ Cleanup completed');
}

// Set up CLI commands
program
    .name('rollback')
    .description('Manage secret backups and rollbacks')
    .version('1.0.0');

program
    .command('list')
    .description('List available backups')
    .action(listBackups);

program
    .command('verify <backup>')
    .description('Verify a specific backup')
    .action(verifyBackup);

program
    .command('restore <backup>')
    .description('Restore secrets from a specific backup')
    .action(restoreBackup);

program
    .command('cleanup')
    .description('Clean up old backups')
    .option('-d, --days <number>', 'Number of days to keep backups', '30')
    .action((options) => cleanupBackups(parseInt(options.days)));

// Parse command line arguments
program.parse(process.argv); 