const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MasterKeyManager {
    constructor(config) {
        this.config = config;
        this.masterKey = process.env.MASTER_BACKUP_KEY;
        this.keyStorePath = path.join(process.cwd(), '.backup-keys');
    }

    async initialize() {
        if (!this.masterKey) {
            throw new Error('MASTER_BACKUP_KEY environment variable is not set');
        }

        // Create key store directory if it doesn't exist
        await fs.mkdir(this.keyStorePath, { recursive: true });
    }

    async encryptBackupKey(backupKey, metadata = {}) {
        await this.initialize();

        // Generate a unique IV for this encryption
        const iv = crypto.randomBytes(12);

        // Create cipher with master key
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(this.masterKey, 'hex'),
            iv
        );

        // Add metadata to the key
        const keyData = {
            key: backupKey,
            metadata: {
                ...metadata,
                encryptedAt: new Date().toISOString()
            }
        };

        // Encrypt the key data
        let encrypted = cipher.update(JSON.stringify(keyData), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    async decryptBackupKey(encryptedData) {
        await this.initialize();

        const { encrypted, iv, authTag } = encryptedData;

        // Create decipher
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(this.masterKey, 'hex'),
            Buffer.from(iv, 'hex')
        );

        // Set authentication tag
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        // Decrypt
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // Parse the decrypted data
        const keyData = JSON.parse(decrypted);
        return keyData;
    }

    async storeBackupKey(backupId, backupKey, metadata = {}) {
        await this.initialize();

        // Encrypt the backup key
        const encryptedData = await this.encryptBackupKey(backupKey, metadata);

        // Store the encrypted key
        const keyPath = path.join(this.keyStorePath, `${backupId}.key`);
        await fs.writeFile(keyPath, JSON.stringify(encryptedData));

        return keyPath;
    }

    async retrieveBackupKey(backupId) {
        await this.initialize();

        const keyPath = path.join(this.keyStorePath, `${backupId}.key`);

        try {
            const encryptedData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
            const keyData = await this.decryptBackupKey(encryptedData);
            return keyData;
        } catch (error) {
            throw new Error(`Failed to retrieve backup key: ${error.message}`);
        }
    }

    async rotateMasterKey(newMasterKey) {
        await this.initialize();

        // Get all stored keys
        const keyFiles = await fs.readdir(this.keyStorePath);

        // Re-encrypt each key with the new master key
        for (const keyFile of keyFiles) {
            if (!keyFile.endsWith('.key')) continue;

            const keyPath = path.join(this.keyStorePath, keyFile);
            const encryptedData = JSON.parse(await fs.readFile(keyPath, 'utf8'));

            // Decrypt with old master key
            const keyData = await this.decryptBackupKey(encryptedData);

            // Encrypt with new master key
            const oldMasterKey = this.masterKey;
            this.masterKey = newMasterKey;
            const newEncryptedData = await this.encryptBackupKey(keyData.key, keyData.metadata);

            // Store the re-encrypted key
            await fs.writeFile(keyPath, JSON.stringify(newEncryptedData));

            // Restore old master key
            this.masterKey = oldMasterKey;
        }
    }

    async listStoredKeys() {
        await this.initialize();

        const keyFiles = await fs.readdir(this.keyStorePath);
        const keys = [];

        for (const keyFile of keyFiles) {
            if (!keyFile.endsWith('.key')) continue;

            const keyPath = path.join(this.keyStorePath, keyFile);
            const encryptedData = JSON.parse(await fs.readFile(keyPath, 'utf8'));

            try {
                const keyData = await this.decryptBackupKey(encryptedData);
                keys.push({
                    id: keyFile.replace('.key', ''),
                    metadata: keyData.metadata,
                    encryptedAt: keyData.metadata.encryptedAt
                });
            } catch (error) {
                console.error(`Failed to decrypt key ${keyFile}: ${error.message}`);
            }
        }

        return keys;
    }
}

module.exports = MasterKeyManager; 