const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MasterKeyManager {
    constructor(config) {
        this.config = config;
        this.ensureDirectories();
    }

    async ensureDirectories() {
        await fs.mkdir(this.config.keyDir, { recursive: true });
    }

    async storeBackupKey(backupId, key, metadata = {}) {
        const keyId = crypto.randomBytes(16).toString('hex');
        const keyPath = path.join(this.config.keyDir, `key-${keyId}.json`);

        const keyData = {
            id: keyId,
            backupId,
            key,
            created: new Date().toISOString(),
            metadata
        };

        await fs.writeFile(keyPath, JSON.stringify(keyData, null, 2));
        return keyId;
    }

    async retrieveBackupKey(backupId) {
        const files = await fs.readdir(this.config.keyDir);
        const keyFiles = files.filter(file => file.startsWith('key-') && file.endsWith('.json'));

        for (const file of keyFiles) {
            const keyPath = path.join(this.config.keyDir, file);
            const keyData = JSON.parse(await fs.readFile(keyPath, 'utf8'));

            if (keyData.backupId === backupId) {
                return keyData;
            }
        }

        throw new Error(`No key found for backup: ${backupId}`);
    }

    async listStoredKeys() {
        const files = await fs.readdir(this.config.keyDir);
        const keyFiles = files.filter(file => file.startsWith('key-') && file.endsWith('.json'));
        const keys = [];

        for (const file of keyFiles) {
            const keyPath = path.join(this.config.keyDir, file);
            const keyData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
            keys.push({
                id: keyData.id,
                backupId: keyData.backupId,
                created: new Date(keyData.created),
                metadata: keyData.metadata
            });
        }

        return keys.sort((a, b) => b.created - a.created);
    }

    async rotateMasterKey() {
        const masterKeyPath = this.config.masterKeyFile;
        const newKey = crypto.randomBytes(32).toString('hex');

        // Read all key files
        const files = await fs.readdir(this.config.keyDir);
        const keyFiles = files.filter(file => file.startsWith('key-') && file.endsWith('.json'));

        // Re-encrypt each key file with the new master key
        for (const file of keyFiles) {
            const keyPath = path.join(this.config.keyDir, file);
            const keyData = JSON.parse(await fs.readFile(keyPath, 'utf8'));

            // Re-encrypt the backup key
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(newKey, 'hex'), iv);
            const encrypted = Buffer.concat([
                cipher.update(keyData.key),
                cipher.final()
            ]);

            // Update the key file
            keyData.key = encrypted.toString('hex');
            keyData.iv = iv.toString('hex');
            keyData.authTag = cipher.getAuthTag().toString('hex');

            await fs.writeFile(keyPath, JSON.stringify(keyData, null, 2));
        }

        // Save the new master key
        await fs.writeFile(masterKeyPath, newKey);
        return newKey;
    }
}

module.exports = MasterKeyManager; 