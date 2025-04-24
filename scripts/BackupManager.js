const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BackupManager {
    constructor(config) {
        this.config = config;
        this.backupDir = path.resolve(process.cwd(), 'backups');
        this.metadataPath = path.join(this.backupDir, 'backup-meta.json');
        this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;

        if (!this.encryptionKey) {
            console.warn('⚠️ No encryption key found. Backups will be stored unencrypted.');
        }
    }

    async _loadMetadata() {
        try {
            const data = await fs.readFile(this.metadataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    async _saveMetadata(metadata) {
        await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
    }

    async _encrypt(content) {
        if (!this.encryptionKey) return { encrypted: content, iv: null };

        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);

        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    async _decrypt(encrypted, iv, authTag) {
        if (!this.encryptionKey) return encrypted;

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(this.encryptionKey, 'hex'),
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    async createBackup(tags = []) {
        try {
            // Create backup directory if it doesn't exist
            await fs.mkdir(this.backupDir, { recursive: true });

            // Read current .env file
            const envPath = path.resolve(process.cwd(), '.env');
            const envContent = await fs.readFile(envPath, 'utf8');

            // Generate backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, `backup-${timestamp}.env`);

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

    async verifyBackup(backupPath) {
        try {
            const content = await fs.readFile(backupPath, 'utf8');
            const checksumPath = `${backupPath}.checksum`;
            const storedChecksum = await fs.readFile(checksumPath, 'utf8');

            // Check if backup is encrypted
            const metaPath = `${backupPath}.meta`;
            let decryptedContent;

            try {
                const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
                decryptedContent = await this._decrypt(content, meta.iv, meta.authTag);
            } catch (error) {
                // If no meta file or decryption fails, assume unencrypted
                decryptedContent = content;
            }

            const calculatedChecksum = crypto.createHash('sha256').update(decryptedContent).digest('hex');

            return {
                isValid: storedChecksum === calculatedChecksum,
                content: decryptedContent
            };
        } catch (error) {
            console.error('Error verifying backup:', error);
            return { isValid: false, content: null };
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

    async listBackups() {
        try {
            const metadata = await this._loadMetadata();
            const backups = [];

            for (const [filename, meta] of Object.entries(metadata)) {
                const filePath = path.join(this.backupDir, filename);
                const stats = await fs.stat(filePath);
                backups.push({
                    filename,
                    path: filePath,
                    created: new Date(meta.created),
                    size: meta.size,
                    encrypted: meta.encrypted,
                    tags: meta.tags || [],
                    checksum: meta.checksum
                });
            }

            return backups.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('Error listing backups:', error);
            return [];
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
}

module.exports = BackupManager; 