#!/usr/bin/env node

require('dotenv').config();

const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');
const inquirer = require('inquirer');
const BackupManager = require('./BackupManager');
const MasterKeyManager = require('./MasterKeyManager');
const config = require('./rotate-secrets.config');

// Initialize managers
const backupManager = new BackupManager(config);
const masterKeyManager = new MasterKeyManager(config);

// Function to generate a new encryption key
function generateNewKey() {
    return crypto.randomBytes(32).toString('hex');
}

// Function to get key fingerprint
function getKeyFingerprint(key) {
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}

// Function to update .env file with new key
async function updateEnvFile(newKey) {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf8');

    const updatedContent = envContent.replace(
        /BACKUP_ENCRYPTION_KEY=.*/,
        `BACKUP_ENCRYPTION_KEY=${newKey}`
    );

    await fs.writeFile(envPath, updatedContent);
}

// Function to rotate backup encryption key
async function rotateBackupKey(options) {
    const { dryRun } = options;

    console.log(chalk.blue('🔄 Starting backup key rotation...'));
    if (dryRun) {
        console.log(chalk.yellow('🧪 DRY RUN MODE - No changes will be made'));
    }

    // Generate new key
    const newKey = generateNewKey();
    const currentKey = process.env.BACKUP_ENCRYPTION_KEY;

    console.log(chalk.green('🔑 Key Information:'));
    console.log(`Current Key Fingerprint: ${chalk.yellow(getKeyFingerprint(currentKey))}`);
    console.log(`New Key Fingerprint: ${chalk.yellow(getKeyFingerprint(newKey))}`);

    // Get all backups
    const backups = await backupManager.listBackups();
    if (backups.length === 0) {
        console.log(chalk.yellow('📭 No backups found to rotate'));
        return;
    }

    console.log(chalk.blue('\n📦 Affected Backups:'));
    for (const backup of backups) {
        if (!backup.encrypted) continue;
        console.log(`- ${chalk.cyan(backup.filename)} (${backup.size} bytes)`);
    }

    if (dryRun) {
        console.log(chalk.yellow('\n🧪 This was a dry run. No changes were made.'));
        return;
    }

    // Re-encrypt each backup
    for (const backup of backups) {
        if (!backup.encrypted) continue;

        console.log(chalk.blue(`\n🔄 Re-encrypting backup: ${backup.filename}`));

        // Read and decrypt with old key
        const { content } = await backupManager.verifyBackup(backup.path);
        if (!content) {
            console.error(chalk.red(`❌ Failed to decrypt backup: ${backup.filename}`));
            continue;
        }

        // Encrypt with new key
        const { encrypted, iv, authTag } = await backupManager._encrypt(content);

        // Write re-encrypted backup
        await fs.writeFile(backup.path, encrypted);
        await fs.writeFile(`${backup.path}.meta`, JSON.stringify({ iv, authTag }));

        // Store the new key with master key
        await masterKeyManager.storeBackupKey(
            path.basename(backup.filename),
            newKey,
            { backupId: backup.filename }
        );

        console.log(chalk.green(`✅ Re-encrypted backup: ${backup.filename}`));
    }

    // Update .env file
    await updateEnvFile(newKey);
    console.log(chalk.green('\n✅ Updated .env file with new key'));

    // Export new key for current session
    process.env.BACKUP_ENCRYPTION_KEY = newKey;

    console.log(chalk.green('\n🎉 Backup key rotation completed successfully!'));
}

// Function to verify backups
async function verifyBackups() {
    console.log(chalk.blue('🔍 Verifying backups...'));

    const backups = await backupManager.listBackups();
    if (backups.length === 0) {
        console.log(chalk.yellow('📭 No backups found to verify'));
        return;
    }

    let verified = 0;
    let failed = 0;

    for (const backup of backups) {
        console.log(chalk.blue(`\nVerifying backup: ${backup.filename}`));
        console.log(`Created: ${chalk.cyan(backup.created.toLocaleString())}`);
        console.log(`Encrypted: ${backup.encrypted ? chalk.green('✅') : chalk.red('❌')}`);

        const { isValid, content } = await backupManager.verifyBackup(backup.path);

        if (isValid) {
            console.log(chalk.green('✅ Backup verified successfully'));
            verified++;
        } else {
            console.error(chalk.red('❌ Backup verification failed'));
            failed++;
        }
    }

    console.log(chalk.blue('\n📊 Verification Summary:'));
    console.log(`Total backups: ${chalk.cyan(backups.length)}`);
    console.log(`✅ Verified: ${chalk.green(verified)}`);
    console.log(`❌ Failed: ${chalk.red(failed)}`);
}

// Function to recover from backup
async function recoverBackup(options) {
    const { file, key, force } = options;

    console.log(chalk.blue('🔄 Starting backup recovery...'));

    // Validate backup file
    if (!file) {
        console.error(chalk.red('❌ No backup file specified'));
        return;
    }

    const backupPath = path.resolve(process.cwd(), file);
    if (!await fs.access(backupPath).then(() => true).catch(() => false)) {
        console.error(chalk.red(`❌ Backup file not found: ${file}`));
        return;
    }

    // Get encryption key
    let encryptionKey = key;
    if (!encryptionKey) {
        try {
            // Try to get key from master key system
            const keyData = await masterKeyManager.retrieveBackupKey(path.basename(file));
            encryptionKey = keyData.key;
            console.log(chalk.green('✅ Retrieved key from master key system'));
        } catch (error) {
            // Fall back to environment variable or prompt
            encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
            if (!encryptionKey) {
                const { providedKey } = await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'providedKey',
                        message: 'Enter the backup encryption key:',
                        validate: input => input.length > 0 ? true : 'Key is required'
                    }
                ]);
                encryptionKey = providedKey;
            }
        }
    }

    // Create temp directory for recovery
    const tempDir = path.join(process.cwd(), '.tmp');
    await fs.mkdir(tempDir, { recursive: true });

    // Attempt recovery
    console.log(chalk.blue(`\n🔍 Attempting to recover from: ${file}`));

    try {
        // Verify backup
        const { isValid, content } = await backupManager.verifyBackup(backupPath);
        if (!isValid) {
            console.error(chalk.red('❌ Backup verification failed'));
            return;
        }

        // Write to temp file first
        const tempFile = path.join(tempDir, 'recovered.env');
        await fs.writeFile(tempFile, content);

        // Verify checksum
        const checksum = crypto.createHash('sha256').update(content).digest('hex');
        console.log(chalk.green(`✅ Backup verified with checksum: ${checksum}`));

        if (!force) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Do you want to restore this backup to .env?',
                    default: false
                }
            ]);

            if (!confirm) {
                console.log(chalk.yellow('🛑 Recovery cancelled'));
                return;
            }
        }

        // Restore to .env
        const envPath = path.resolve(process.cwd(), '.env');
        await fs.copyFile(tempFile, envPath);

        console.log(chalk.green('\n✅ Backup recovered successfully!'));
        console.log(chalk.blue('📝 The recovered .env file has been saved'));

    } catch (error) {
        console.error(chalk.red(`❌ Recovery failed: ${error.message}`));
    } finally {
        // Cleanup temp directory
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

// Function to rotate master key
async function rotateMasterKey(options) {
    const { dryRun } = options;

    console.log(chalk.blue('🔄 Starting master key rotation...'));
    if (dryRun) {
        console.log(chalk.yellow('🧪 DRY RUN MODE - No changes will be made'));
    }

    // Generate new master key
    const newMasterKey = generateNewKey();
    const currentMasterKey = process.env.MASTER_BACKUP_KEY;

    console.log(chalk.green('🔑 Key Information:'));
    console.log(`Current Master Key Fingerprint: ${chalk.yellow(getKeyFingerprint(currentMasterKey))}`);
    console.log(`New Master Key Fingerprint: ${chalk.yellow(getKeyFingerprint(newMasterKey))}`);

    if (dryRun) {
        console.log(chalk.yellow('\n🧪 This was a dry run. No changes were made.'));
        return;
    }

    // Rotate master key
    await masterKeyManager.rotateMasterKey(newMasterKey);

    // Update .env file
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf8');
    const updatedContent = envContent.replace(
        /MASTER_BACKUP_KEY=.*/,
        `MASTER_BACKUP_KEY=${newMasterKey}`
    );
    await fs.writeFile(envPath, updatedContent);

    // Export new key for current session
    process.env.MASTER_BACKUP_KEY = newMasterKey;

    console.log(chalk.green('\n🎉 Master key rotation completed successfully!'));
}

// Function to list stored keys
async function listStoredKeys() {
    console.log(chalk.blue('🔑 Listing stored backup keys...'));

    try {
        const keys = await masterKeyManager.listStoredKeys();

        if (keys.length === 0) {
            console.log(chalk.yellow('📭 No stored keys found'));
            return;
        }

        console.log(chalk.green('\n📋 Stored Keys:'));
        for (const key of keys) {
            console.log(`\nID: ${chalk.cyan(key.id)}`);
            console.log(`Encrypted At: ${chalk.cyan(key.encryptedAt)}`);
            if (key.metadata.backupId) {
                console.log(`Backup ID: ${chalk.cyan(key.metadata.backupId)}`);
            }
        }

    } catch (error) {
        console.error(chalk.red(`❌ Failed to list stored keys: ${error.message}`));
    }
}

// Set up CLI commands
program
    .name('drifti-secrets')
    .description('Manage encrypted backups and secrets')
    .version('1.0.0');

program
    .command('rotate-key')
    .description('Rotate the backup encryption key')
    .option('--dry-run', 'Show what would happen without making changes')
    .action(rotateBackupKey);

program
    .command('verify')
    .description('Verify all backups')
    .action(verifyBackups);

program
    .command('recover')
    .description('Recover from an encrypted backup')
    .requiredOption('-f, --file <path>', 'Path to the backup file')
    .option('-k, --key <key>', 'Backup encryption key')
    .option('--force', 'Skip confirmation prompt')
    .action(recoverBackup);

program
    .command('rotate-master-key')
    .description('Rotate the master backup key')
    .option('--dry-run', 'Show what would happen without making changes')
    .action(rotateMasterKey);

program
    .command('list-keys')
    .description('List all stored backup keys')
    .action(listStoredKeys);

// Parse command line arguments
program.parse(process.argv); 