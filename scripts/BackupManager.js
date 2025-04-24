const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const glob = require('glob');

class BackupManager {
    constructor(config) {
        this.config = config;
        this.ensureDirectories();
    }

    async ensureDirectories() {
        await fs.mkdir(this.config.backupDir, { recursive: true });
        await fs.mkdir(this.config.keyDir, { recursive: true });
    }

    async listBackups() {
        const files = await glob(this.config.backupPattern, { cwd: this.config.backupDir });
        const backups = [];

        for (const file of files) {
            const filePath = path.join(this.config.backupDir, file);
            const stats = await fs.stat(filePath);
            const metaPath = `${filePath}.meta`;

            backups.push({
                filename: file,
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                encrypted: await fs.access(metaPath).then(() => true).catch(() => false)
            });
        }

        return backups.sort((a, b) => b.created - a.created);
    }

    async verifyBackup(backupPath) {
        try {
            const content = await fs.readFile(backupPath);
            const metaPath = `${backupPath}.meta`;

            // Check if backup is encrypted
            const hasMeta = await fs.access(metaPath).then(() => true).catch(() => false);
            if (!hasMeta) {
                return { isValid: true, content: content.toString() };
            }

            // Read metadata
            const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
            const { iv, authTag } = meta;

            // Decrypt content
            const key = process.env.BACKUP_ENCRYPTION_KEY;
            if (!key) {
                throw new Error('No encryption key found');
            }

            const decipher = crypto.createDecipheriv(
                this.config.encryptionAlgorithm,
                Buffer.from(key, 'hex'),
                Buffer.from(iv, 'hex')
            );

            decipher.setAuthTag(Buffer.from(authTag, 'hex'));

            const decrypted = Buffer.concat([
                decipher.update(content),
                decipher.final()
            ]);

            return { isValid: true, content: decrypted.toString() };
        } catch (error) {
            console.error('Backup verification failed:', error);
            return { isValid: false, content: null };
        }
    }

    async _encrypt(content) {
        const key = process.env.BACKUP_ENCRYPTION_KEY;
        if (!key) {
            throw new Error('No encryption key found');
        }

        const iv = crypto.randomBytes(this.config.ivLength);
        const cipher = crypto.createCipheriv(
            this.config.encryptionAlgorithm,
            Buffer.from(key, 'hex'),
            iv
        );

        const encrypted = Buffer.concat([
            cipher.update(content),
            cipher.final()
        ]);

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: cipher.getAuthTag().toString('hex')
        };
    }

    async createBackup(tags = []) {
        try {
            // Create backup directory if it doesn't exist
            await fs.mkdir(this.config.backupDir, { recursive: true });

            // Read current .env file
            const envPath = path.resolve(process.cwd(), '.env');
            const envContent = await fs.readFile(envPath, 'utf8');

            // Generate backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.config.backupDir, `backup-${timestamp}.env`);

            // Encrypt content if key is available
            const { encrypted, iv, authTag } = await this._encrypt(envContent);

            // Write backup file
            await fs.writeFile(backupPath, encrypted);

            // Create checksum of original content
            const checksum = crypto.createHash('sha256').update(envContent).digest('hex');
            await fs.writeFile(`${backupPath}.checksum`, checksum);

            // Store encryption metadata if encrypted
            if (iv) {
                await fs.writeFile(`${backupPath}.meta`, JSON.stringify({ iv, authTag }));
            }

            // Update metadata
            const metadata = await this._loadMetadata();
            metadata[path.basename(backupPath)] = {
                created: new Date().toISOString(),
                size: encrypted.length,
                encrypted: !!iv,
                tags,
                checksum
            };
            await this._saveMetadata(metadata);

            return backupPath;
        } catch (error) {
            console.error('Error creating backup:', error);
            return null;
        }
    }

    async restoreBackup(backupPath) {
        try {
            // Verify backup
            const { isValid, content } = await this.verifyBackup(backupPath);
            if (!isValid) {
                console.error('Invalid backup file');
                return false;
            }

            // Restore .env file
            const envPath = path.resolve(process.cwd(), '.env');
            await fs.writeFile(envPath, content);

            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    async cleanupBackups(maxAgeDays = 30) {
        try {
            const backups = await this.listBackups();
            const now = new Date();
            const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
            const metadata = await this._loadMetadata();

            for (const backup of backups) {
                const age = now - backup.created;
                if (age > maxAge) {
                    await fs.unlink(backup.path);
                    await fs.unlink(`${backup.path}.checksum`);
                    if (backup.encrypted) {
                        await fs.unlink(`${backup.path}.meta`);
                    }
                    delete metadata[backup.filename];
                    console.log(`Deleted old backup: ${backup.filename}`);
                }
            }

            await this._saveMetadata(metadata);
        } catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }

    async _loadMetadata() {
        try {
            const data = await fs.readFile(this.config.metadataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    async _saveMetadata(metadata) {
        await fs.writeFile(this.config.metadataPath, JSON.stringify(metadata, null, 2));
    }
}

module.exports = BackupManager; 