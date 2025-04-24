const crypto = require('crypto');

// Secret validation rules
const SECRET_RULES = {
    JWT_SECRET: {
        minLength: 32,
        maxLength: 64,
        allowedChars: /^[A-Za-z0-9+/=]+$/,
        description: 'JWT signing key'
    },
    ADMIN_PASSWORD: {
        minLength: 16,
        maxLength: 32,
        allowedChars: /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
        description: 'Admin access password'
    },
    DB_PASSWORD: {
        minLength: 16,
        maxLength: 32,
        allowedChars: /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
        description: 'Database connection password'
    },
    REDIS_PASSWORD: {
        minLength: 16,
        maxLength: 32,
        allowedChars: /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
        description: 'Redis connection password'
    }
};

// Generate a secure random value with specific requirements
function generateSecureSecret(type, length) {
    const rule = SECRET_RULES[type];
    if (!rule) {
        throw new Error(`Unknown secret type: ${type}`);
    }

    // Ensure length is within bounds
    const actualLength = Math.min(Math.max(length, rule.minLength), rule.maxLength);

    // Generate random bytes and convert to base64
    const randomBytes = crypto.randomBytes(actualLength);
    let secret = randomBytes.toString('base64');

    // Ensure the secret meets character requirements
    while (!rule.allowedChars.test(secret)) {
        randomBytes = crypto.randomBytes(actualLength);
        secret = randomBytes.toString('base64');
    }

    return secret;
}

// Validate a secret against its rules
function validateSecret(type, secret) {
    const rule = SECRET_RULES[type];
    if (!rule) {
        throw new Error(`Unknown secret type: ${type}`);
    }

    const errors = [];

    if (secret.length < rule.minLength) {
        errors.push(`Secret is too short (minimum ${rule.minLength} characters)`);
    }
    if (secret.length > rule.maxLength) {
        errors.push(`Secret is too long (maximum ${rule.maxLength} characters)`);
    }
    if (!rule.allowedChars.test(secret)) {
        errors.push('Secret contains invalid characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
        rule
    };
}

// Validate the entire configuration
function validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Check if all required sections exist
    const requiredSections = ['secrets', 'deployment', 'notifications', 'rollback', 'restart'];
    for (const section of requiredSections) {
        if (!config[section]) {
            errors.push(`Missing required section: ${section}`);
        }
    }

    // Validate secrets configuration
    if (config.secrets) {
        for (const [type, settings] of Object.entries(config.secrets)) {
            if (!SECRET_RULES[type]) {
                errors.push(`Unknown secret type: ${type}`);
                continue;
            }

            if (!settings.length) {
                errors.push(`Missing length for secret: ${type}`);
            } else if (settings.length < SECRET_RULES[type].minLength) {
                errors.push(`Length too short for ${type} (minimum ${SECRET_RULES[type].minLength})`);
            } else if (settings.length > SECRET_RULES[type].maxLength) {
                errors.push(`Length too long for ${type} (maximum ${SECRET_RULES[type].maxLength})`);
            }
        }
    }

    // Validate deployment configuration
    if (config.deployment) {
        const validPlatforms = ['none', 'firebase', 'render', 'railway'];
        if (!validPlatforms.includes(config.deployment.platform)) {
            errors.push(`Invalid deployment platform: ${config.deployment.platform}`);
        }
    }

    // Validate notification configuration
    if (config.notifications) {
        if (config.notifications.enabled) {
            if (config.notifications.slack && !config.notifications.slack.webhookUrl) {
                warnings.push('Slack notifications enabled but webhook URL not provided');
            }
            if (config.notifications.email) {
                const requiredEmailFields = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'];
                for (const field of requiredEmailFields) {
                    if (!config.notifications.email[field]) {
                        warnings.push(`Email notifications enabled but ${field} not provided`);
                    }
                }
            }
        }
    }

    // Validate rollback configuration
    if (config.rollback) {
        if (config.rollback.enabled && !config.rollback.backupPath) {
            errors.push('Rollback enabled but backup path not specified');
        }
    }

    // Validate restart configuration
    if (config.restart) {
        if (config.restart.enabled) {
            if (!config.restart.command) {
                errors.push('Restart enabled but command not specified');
            }
            if (typeof config.restart.delay !== 'number' || config.restart.delay < 0) {
                errors.push('Invalid restart delay value');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

module.exports = {
    generateSecureSecret,
    validateSecret,
    validateConfig,
    SECRET_RULES
}; 