import StorageFactory from './storage/StorageFactory';
import { z } from 'zod';

class ConfigStorage {
    constructor(options = {}) {
        this.options = {
            storageType: options.storageType || 'local',
            storageOptions: options.storageOptions || {},
            ...options
        };
        this.storage = null;
        this.schema = this.createSchema();
        this.migrations = this.createMigrations();
        this.validationSchemas = this.createValidationSchemas();
    }

    createMigrations() {
        return {
            '1.0.0': {
                up: (config) => {
                    // Initial version, no migration needed
                    return config;
                },
                down: (config) => {
                    // Rollback to initial version
                    return {
                        version: '1.0.0',
                        lastModified: new Date().toISOString(),
                        metadata: {
                            description: config.metadata?.description || 'Default monitoring configuration',
                            author: config.metadata?.author || 'system',
                            tags: config.metadata?.tags || ['default'],
                            environment: config.metadata?.environment || 'production'
                        },
                        thresholds: {
                            cpu: config.thresholds?.cpu || 80,
                            memory: config.thresholds?.memory || 85,
                            latency: config.thresholds?.latency || 1000,
                            disk: config.thresholds?.disk || 90,
                            network: config.thresholds?.network || 75
                        },
                        alerts: {
                            enabled: config.alerts?.enabled ?? true,
                            email: config.alerts?.email ? {
                                enabled: true,
                                recipients: Array.isArray(config.alerts.email) ? config.alerts.email : [config.alerts.email],
                                severity: 'warning',
                                cooldown: 300
                            } : undefined,
                            slack: config.alerts?.slack ? {
                                enabled: true,
                                webhook: typeof config.alerts.slack === 'string' ? config.alerts.slack : config.alerts.slack.webhook,
                                channel: '#monitoring',
                                username: 'Monitoring Bot'
                            } : undefined
                        },
                        autoScaling: {
                            enabled: config.autoScaling?.enabled ?? true,
                            minInstances: config.autoScaling?.minInstances || 2,
                            maxInstances: config.autoScaling?.maxInstances || 10,
                            scaleUpThreshold: config.autoScaling?.scaleUpThreshold || 75,
                            scaleDownThreshold: config.autoScaling?.scaleDownThreshold || 25,
                            rules: [{
                                metric: 'cpu',
                                threshold: 75,
                                cooldown: 300,
                                step: 1
                            }],
                            cooldown: 300
                        },
                        retention: {
                            enabled: true,
                            maxAge: 30 * 24 * 60 * 60,
                            maxSize: 1024 * 1024 * 1024,
                            compression: true
                        },
                        display: {
                            theme: 'system',
                            refreshInterval: 5,
                            showP95: true,
                            showP99: true,
                            historicalDataPoints: 50,
                            timeRange: '24h',
                            charts: ['cpu', 'memory', 'latency', 'requests', 'errors']
                        },
                        features: {
                            anomalyDetection: true,
                            predictiveScaling: false,
                            costOptimization: true,
                            customMetrics: []
                        }
                    };
                }
            },
            '1.1.0': {
                up: (config) => {
                    // Add support for custom alert templates
                    return {
                        ...config,
                        alerts: {
                            ...config.alerts,
                            email: config.alerts.email ? {
                                ...config.alerts.email,
                                template: config.alerts.email.template || 'default'
                            } : undefined,
                            slack: config.alerts.slack ? {
                                ...config.alerts.slack,
                                template: config.alerts.slack.template || 'default'
                            } : undefined
                        }
                    };
                },
                down: (config) => {
                    // Remove custom alert templates
                    const { template: _, ...emailWithoutTemplate } = config.alerts.email || {};
                    const { template: __, ...slackWithoutTemplate } = config.alerts.slack || {};
                    return {
                        ...config,
                        alerts: {
                            ...config.alerts,
                            email: emailWithoutTemplate,
                            slack: slackWithoutTemplate
                        }
                    };
                }
            },
            '1.2.0': {
                up: (config) => {
                    // Add support for custom metrics with validation
                    return {
                        ...config,
                        features: {
                            ...config.features,
                            customMetrics: config.features.customMetrics?.map(metric => ({
                                name: metric.name || metric,
                                type: metric.type || 'gauge',
                                unit: metric.unit || 'count',
                                description: metric.description || '',
                                labels: metric.labels || {}
                            })) || []
                        }
                    };
                },
                down: (config) => {
                    // Simplify custom metrics to just names
                    return {
                        ...config,
                        features: {
                            ...config.features,
                            customMetrics: config.features.customMetrics?.map(metric => 
                                typeof metric === 'string' ? metric : metric.name
                            ) || []
                        }
                    };
                }
            }
        };
    }

    createSchema() {
        // Define reusable schemas
        const emailSchema = z.string().email().min(1);
        const urlSchema = z.string().url().min(1);
        const percentageSchema = z.number().min(0).max(100);
        const positiveNumberSchema = z.number().positive();
        const timestampSchema = z.string().datetime();

        // Define nested schemas
        const thresholdSchema = z.object({
            cpu: percentageSchema,
            memory: percentageSchema,
            latency: positiveNumberSchema,
            disk: percentageSchema.optional(),
            network: percentageSchema.optional()
        });

        const alertChannelSchema = z.object({
            enabled: z.boolean(),
            recipients: z.array(emailSchema).min(1),
            severity: z.enum(['info', 'warning', 'error', 'critical']),
            cooldown: positiveNumberSchema.optional(),
            template: z.string().optional()
        });

        const alertSchema = z.object({
            enabled: z.boolean(),
            email: alertChannelSchema.optional(),
            slack: z.object({
                enabled: z.boolean(),
                webhook: urlSchema,
                channel: z.string().min(1),
                username: z.string().min(1).optional(),
                icon: urlSchema.optional()
            }).optional(),
            webhook: z.object({
                enabled: z.boolean(),
                url: urlSchema,
                method: z.enum(['POST', 'PUT']),
                headers: z.record(z.string()).optional(),
                bodyTemplate: z.string().optional()
            }).optional()
        });

        const scalingRuleSchema = z.object({
            metric: z.enum(['cpu', 'memory', 'latency', 'requests']),
            threshold: percentageSchema,
            cooldown: positiveNumberSchema,
            step: positiveNumberSchema
        });

        const autoScalingSchema = z.object({
            enabled: z.boolean(),
            minInstances: positiveNumberSchema,
            maxInstances: positiveNumberSchema,
            scaleUpThreshold: percentageSchema,
            scaleDownThreshold: percentageSchema,
            rules: z.array(scalingRuleSchema).min(1),
            cooldown: positiveNumberSchema
        });

        const retentionPolicySchema = z.object({
            enabled: z.boolean(),
            maxAge: positiveNumberSchema,
            maxSize: positiveNumberSchema,
            compression: z.boolean().optional()
        });

        const displaySchema = z.object({
            theme: z.enum(['light', 'dark', 'system']),
            refreshInterval: positiveNumberSchema,
            showP95: z.boolean(),
            showP99: z.boolean(),
            historicalDataPoints: positiveNumberSchema,
            timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']),
            charts: z.array(z.enum(['cpu', 'memory', 'latency', 'requests', 'errors']))
        });

        // Main configuration schema
        return z.object({
            version: z.string().regex(/^\d+\.\d+\.\d+$/),
            lastModified: timestampSchema,
            metadata: z.object({
                description: z.string().optional(),
                author: z.string().min(1),
                tags: z.array(z.string()).min(1),
                environment: z.enum(['development', 'staging', 'production']),
                region: z.string().optional()
            }),
            thresholds: thresholdSchema,
            alerts: alertSchema,
            autoScaling: autoScalingSchema,
            retention: retentionPolicySchema,
            display: displaySchema,
            features: z.object({
                anomalyDetection: z.boolean(),
                predictiveScaling: z.boolean(),
                costOptimization: z.boolean(),
                customMetrics: z.array(z.string()).optional()
            })
        });
    }

    createValidationSchemas() {
        // Define validation schemas for each version
        return {
            '1.0.0': {
                validate: (config) => {
                    const schema = z.object({
                        version: z.literal('1.0.0'),
                        lastModified: z.string().datetime(),
                        metadata: z.object({
                            description: z.string().optional(),
                            author: z.string().min(1),
                            tags: z.array(z.string()).min(1),
                            environment: z.enum(['development', 'staging', 'production'])
                        }),
                        thresholds: z.object({
                            cpu: z.number().min(0).max(100),
                            memory: z.number().min(0).max(100),
                            latency: z.number().positive()
                        }),
                        alerts: z.object({
                            enabled: z.boolean(),
                            email: z.object({
                                enabled: z.boolean(),
                                recipients: z.array(z.string().email()),
                                severity: z.enum(['info', 'warning', 'error', 'critical']),
                                cooldown: z.number().positive()
                            }).optional(),
                            slack: z.object({
                                enabled: z.boolean(),
                                webhook: z.string().url(),
                                channel: z.string().min(1),
                                username: z.string().min(1)
                            }).optional()
                        }),
                        autoScaling: z.object({
                            enabled: z.boolean(),
                            minInstances: z.number().positive(),
                            maxInstances: z.number().positive(),
                            scaleUpThreshold: z.number().min(0).max(100),
                            scaleDownThreshold: z.number().min(0).max(100),
                            rules: z.array(z.object({
                                metric: z.enum(['cpu', 'memory', 'latency', 'requests']),
                                threshold: z.number().min(0).max(100),
                                cooldown: z.number().positive(),
                                step: z.number().positive()
                            }))
                        })
                    });

                    return schema.safeParse(config);
                },
                validateTransition: (fromConfig, toConfig) => {
                    // Ensure no data loss during migration
                    const requiredFields = ['metadata', 'thresholds', 'alerts', 'autoScaling'];
                    const missingFields = requiredFields.filter(field => !toConfig[field]);
                    
                    if (missingFields.length > 0) {
                        return {
                            valid: false,
                            error: `Missing required fields: ${missingFields.join(', ')}`
                        };
                    }

                    // Validate threshold ranges
                    const thresholdFields = ['cpu', 'memory', 'latency'];
                    for (const field of thresholdFields) {
                        if (toConfig.thresholds[field] < 0 || toConfig.thresholds[field] > 100) {
                            return {
                                valid: false,
                                error: `Invalid threshold value for ${field}`
                            };
                        }
                    }

                    // Validate auto-scaling rules
                    if (toConfig.autoScaling.enabled && toConfig.autoScaling.rules.length === 0) {
                        return {
                            valid: false,
                            error: 'Auto-scaling enabled but no rules defined'
                        };
                    }

                    return { valid: true };
                }
            },
            '1.1.0': {
                validate: (config) => {
                    const schema = z.object({
                        version: z.literal('1.1.0'),
                        lastModified: z.string().datetime(),
                        metadata: z.object({
                            description: z.string().optional(),
                            author: z.string().min(1),
                            tags: z.array(z.string()).min(1),
                            environment: z.enum(['development', 'staging', 'production'])
                        }),
                        thresholds: z.object({
                            cpu: z.number().min(0).max(100),
                            memory: z.number().min(0).max(100),
                            latency: z.number().positive(),
                            disk: z.number().min(0).max(100).optional(),
                            network: z.number().min(0).max(100).optional()
                        }),
                        alerts: z.object({
                            enabled: z.boolean(),
                            email: z.object({
                                enabled: z.boolean(),
                                recipients: z.array(z.string().email()),
                                severity: z.enum(['info', 'warning', 'error', 'critical']),
                                cooldown: z.number().positive(),
                                template: z.string().optional()
                            }).optional(),
                            slack: z.object({
                                enabled: z.boolean(),
                                webhook: z.string().url(),
                                channel: z.string().min(1),
                                username: z.string().min(1),
                                template: z.string().optional()
                            }).optional()
                        }),
                        autoScaling: z.object({
                            enabled: z.boolean(),
                            minInstances: z.number().positive(),
                            maxInstances: z.number().positive(),
                            scaleUpThreshold: z.number().min(0).max(100),
                            scaleDownThreshold: z.number().min(0).max(100),
                            rules: z.array(z.object({
                                metric: z.enum(['cpu', 'memory', 'latency', 'requests']),
                                threshold: z.number().min(0).max(100),
                                cooldown: z.number().positive(),
                                step: z.number().positive()
                            }))
                        })
                    });

                    return schema.safeParse(config);
                },
                validateTransition: (fromConfig, toConfig) => {
                    // Enhanced alert template validation
                    const validateTemplate = (template, type) => {
                        if (!template) return { valid: true };

                        // Required placeholders based on alert type
                        const requiredPlaceholders = {
                            email: ['{{message}}', '{{timestamp}}', '{{severity}}'],
                            slack: ['{{message}}', '{{timestamp}}', '{{severity}}', '{{details}}'],
                            webhook: ['{{message}}', '{{timestamp}}', '{{severity}}', '{{details}}', '{{metadata}}']
                        };

                        // Check for required placeholders
                        const missingPlaceholders = requiredPlaceholders[type].filter(
                            placeholder => !template.includes(placeholder)
                        );

                        if (missingPlaceholders.length > 0) {
                            return {
                                valid: false,
                                error: `Missing required placeholders for ${type} template: ${missingPlaceholders.join(', ')}`
                            };
                        }

                        // Validate template syntax
                        try {
                            // Check for balanced braces
                            let braceCount = 0;
                            for (const char of template) {
                                if (char === '{') braceCount++;
                                if (char === '}') braceCount--;
                                if (braceCount < 0) throw new Error('Unbalanced braces');
                            }
                            if (braceCount !== 0) throw new Error('Unbalanced braces');

                            // Check for valid placeholder format
                            const placeholderRegex = /\{\{([^}]+)\}\}/g;
                            let match;
                            while ((match = placeholderRegex.exec(template)) !== null) {
                                const placeholder = match[1].trim();
                                if (!/^[a-zA-Z0-9_]+$/.test(placeholder)) {
                                    throw new Error(`Invalid placeholder format: ${placeholder}`);
                                }
                            }

                            // Check for conditional logic syntax
                            const conditionalRegex = /\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g;
                            let conditionalMatch;
                            while ((conditionalMatch = conditionalRegex.exec(template)) !== null) {
                                const condition = conditionalMatch[1].trim();
                                if (!/^[a-zA-Z0-9_]+$/.test(condition)) {
                                    throw new Error(`Invalid conditional expression: ${condition}`);
                                }
                            }

                            // Check for maximum template length
                            if (template.length > 5000) {
                                throw new Error('Template exceeds maximum length of 5000 characters');
                            }

                            // Check for maximum nesting depth
                            let depth = 0;
                            let maxDepth = 0;
                            for (const char of template) {
                                if (char === '{') depth++;
                                if (char === '}') depth--;
                                maxDepth = Math.max(maxDepth, depth);
                            }
                            if (maxDepth > 5) {
                                throw new Error('Template exceeds maximum nesting depth of 5');
                            }

                            return { valid: true };
                        } catch (error) {
                            return {
                                valid: false,
                                error: `Invalid template syntax: ${error.message}`
                            };
                        }
                    };

                    // Validate email template
                    if (toConfig.alerts.email?.template) {
                        const emailResult = validateTemplate(toConfig.alerts.email.template, 'email');
                        if (!emailResult.valid) {
                            return emailResult;
                        }
                    }

                    // Validate slack template
                    if (toConfig.alerts.slack?.template) {
                        const slackResult = validateTemplate(toConfig.alerts.slack.template, 'slack');
                        if (!slackResult.valid) {
                            return slackResult;
                        }
                    }

                    // Validate webhook template
                    if (toConfig.alerts.webhook?.template) {
                        const webhookResult = validateTemplate(toConfig.alerts.webhook.template, 'webhook');
                        if (!webhookResult.valid) {
                            return webhookResult;
                        }
                    }

                    return { valid: true };
                }
            },
            '1.2.0': {
                validate: (config) => {
                    const schema = z.object({
                        version: z.literal('1.2.0'),
                        lastModified: z.string().datetime(),
                        metadata: z.object({
                            description: z.string().optional(),
                            author: z.string().min(1),
                            tags: z.array(z.string()).min(1),
                            environment: z.enum(['development', 'staging', 'production']),
                            region: z.string().optional()
                        }),
                        thresholds: z.object({
                            cpu: z.number().min(0).max(100),
                            memory: z.number().min(0).max(100),
                            latency: z.number().positive(),
                            disk: z.number().min(0).max(100).optional(),
                            network: z.number().min(0).max(100).optional()
                        }),
                        alerts: z.object({
                            enabled: z.boolean(),
                            email: z.object({
                                enabled: z.boolean(),
                                recipients: z.array(z.string().email()),
                                severity: z.enum(['info', 'warning', 'error', 'critical']),
                                cooldown: z.number().positive(),
                                template: z.string().optional()
                            }).optional(),
                            slack: z.object({
                                enabled: z.boolean(),
                                webhook: z.string().url(),
                                channel: z.string().min(1),
                                username: z.string().min(1),
                                template: z.string().optional()
                            }).optional(),
                            webhook: z.object({
                                enabled: z.boolean(),
                                url: z.string().url(),
                                method: z.enum(['POST', 'PUT']),
                                headers: z.record(z.string()).optional(),
                                bodyTemplate: z.string().optional()
                            }).optional()
                        }),
                        autoScaling: z.object({
                            enabled: z.boolean(),
                            minInstances: z.number().positive(),
                            maxInstances: z.number().positive(),
                            scaleUpThreshold: z.number().min(0).max(100),
                            scaleDownThreshold: z.number().min(0).max(100),
                            rules: z.array(z.object({
                                metric: z.enum(['cpu', 'memory', 'latency', 'requests']),
                                threshold: z.number().min(0).max(100),
                                cooldown: z.number().positive(),
                                step: z.number().positive()
                            })),
                            cooldown: z.number().positive()
                        }),
                        retention: z.object({
                            enabled: z.boolean(),
                            maxAge: z.number().positive(),
                            maxSize: z.number().positive(),
                            compression: z.boolean().optional()
                        }),
                        display: z.object({
                            theme: z.enum(['light', 'dark', 'system']),
                            refreshInterval: z.number().positive(),
                            showP95: z.boolean(),
                            showP99: z.boolean(),
                            historicalDataPoints: z.number().positive(),
                            timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']),
                            charts: z.array(z.enum(['cpu', 'memory', 'latency', 'requests', 'errors']))
                        }),
                        features: z.object({
                            anomalyDetection: z.boolean(),
                            predictiveScaling: z.boolean(),
                            costOptimization: z.boolean(),
                            customMetrics: z.array(z.object({
                                name: z.string().min(1),
                                type: z.enum(['gauge', 'counter', 'histogram']),
                                unit: z.string().min(1),
                                description: z.string().optional(),
                                labels: z.record(z.string()).optional()
                            }))
                        })
                    });

                    return schema.safeParse(config);
                },
                validateTransition: (fromConfig, toConfig) => {
                    // Validate custom metrics
                    if (toConfig.features.customMetrics?.length > 0) {
                        const metricNames = new Set();
                        for (const metric of toConfig.features.customMetrics) {
                            if (metricNames.has(metric.name)) {
                                return {
                                    valid: false,
                                    error: `Duplicate metric name: ${metric.name}`
                                };
                            }
                            metricNames.add(metric.name);

                            // Validate metric type and unit combinations
                            if (metric.type === 'counter' && !['count', 'requests', 'bytes'].includes(metric.unit)) {
                                return {
                                    valid: false,
                                    error: `Invalid unit ${metric.unit} for counter metric ${metric.name}`
                                };
                            }
                        }
                    }

                    // Validate retention policy
                    if (toConfig.retention.enabled) {
                        if (toConfig.retention.maxAge < 3600) { // Minimum 1 hour
                            return {
                                valid: false,
                                error: 'Retention maxAge must be at least 1 hour'
                            };
                        }
                        if (toConfig.retention.maxSize < 1024 * 1024) { // Minimum 1MB
                            return {
                                valid: false,
                                error: 'Retention maxSize must be at least 1MB'
                            };
                        }
                    }

                    // Enhanced alert template validation with conditional logic
                    const validateTemplate = (template, type) => {
                        if (!template) return { valid: true };

                        // Required placeholders based on alert type
                        const requiredPlaceholders = {
                            email: ['{{message}}', '{{timestamp}}', '{{severity}}'],
                            slack: ['{{message}}', '{{timestamp}}', '{{severity}}', '{{details}}'],
                            webhook: ['{{message}}', '{{timestamp}}', '{{severity}}', '{{details}}', '{{metadata}}']
                        };

                        // Check for required placeholders
                        const missingPlaceholders = requiredPlaceholders[type].filter(
                            placeholder => !template.includes(placeholder)
                        );

                        if (missingPlaceholders.length > 0) {
                            return {
                                valid: false,
                                error: `Missing required placeholders for ${type} template: ${missingPlaceholders.join(', ')}`
                            };
                        }

                        // Validate template syntax
                        try {
                            // Check for balanced braces
                            let braceCount = 0;
                            for (const char of template) {
                                if (char === '{') braceCount++;
                                if (char === '}') braceCount--;
                                if (braceCount < 0) throw new Error('Unbalanced braces');
                            }
                            if (braceCount !== 0) throw new Error('Unbalanced braces');

                            // Check for valid placeholder format
                            const placeholderRegex = /\{\{([^}]+)\}\}/g;
                            let match;
                            while ((match = placeholderRegex.exec(template)) !== null) {
                                const placeholder = match[1].trim();
                                if (!/^[a-zA-Z0-9_]+$/.test(placeholder)) {
                                    throw new Error(`Invalid placeholder format: ${placeholder}`);
                                }
                            }

                            // Check for conditional logic syntax
                            const conditionalRegex = /\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g;
                            let conditionalMatch;
                            while ((conditionalMatch = conditionalRegex.exec(template)) !== null) {
                                const condition = conditionalMatch[1].trim();
                                if (!/^[a-zA-Z0-9_]+$/.test(condition)) {
                                    throw new Error(`Invalid conditional expression: ${condition}`);
                                }
                            }

                            // Check for maximum template length
                            if (template.length > 5000) {
                                throw new Error('Template exceeds maximum length of 5000 characters');
                            }

                            // Check for maximum nesting depth
                            let depth = 0;
                            let maxDepth = 0;
                            for (const char of template) {
                                if (char === '{') depth++;
                                if (char === '}') depth--;
                                maxDepth = Math.max(maxDepth, depth);
                            }
                            if (maxDepth > 5) {
                                throw new Error('Template exceeds maximum nesting depth of 5');
                            }

                            return { valid: true };
                        } catch (error) {
                            return {
                                valid: false,
                                error: `Invalid template syntax: ${error.message}`
                            };
                        }
                    };

                    // Validate email template
                    if (toConfig.alerts.email?.template) {
                        const emailResult = validateTemplate(toConfig.alerts.email.template, 'email');
                        if (!emailResult.valid) {
                            return emailResult;
                        }
                    }

                    // Validate slack template
                    if (toConfig.alerts.slack?.template) {
                        const slackResult = validateTemplate(toConfig.alerts.slack.template, 'slack');
                        if (!slackResult.valid) {
                            return slackResult;
                        }
                    }

                    // Validate webhook template
                    if (toConfig.alerts.webhook?.template) {
                        const webhookResult = validateTemplate(toConfig.alerts.webhook.template, 'webhook');
                        if (!webhookResult.valid) {
                            return webhookResult;
                        }
                    }

                    return { valid: true };
                }
            }
        };
    }

    async initialize() {
        try {
            this.storage = await StorageFactory.createStorage(
                this.options.storageType,
                this.options.storageOptions
            );
            console.log('ConfigStorage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ConfigStorage:', error);
            throw error;
        }
    }

    async migrateConfig(config, targetVersion) {
        const currentVersion = config.version;
        if (currentVersion === targetVersion) {
            return config;
        }

        const versions = Object.keys(this.migrations).sort((a, b) => {
            const [majorA, minorA, patchA] = a.split('.').map(Number);
            const [majorB, minorB, patchB] = b.split('.').map(Number);
            return majorA - majorB || minorA - minorB || patchA - patchB;
        });

        const currentIndex = versions.indexOf(currentVersion);
        const targetIndex = versions.indexOf(targetVersion);

        if (currentIndex === -1 || targetIndex === -1) {
            throw new Error(`Invalid version: ${currentVersion} or ${targetVersion}`);
        }

        let migratedConfig = { ...config };

        if (currentIndex < targetIndex) {
            // Migrate up
            for (let i = currentIndex; i < targetIndex; i++) {
                const version = versions[i + 1];
                const migration = this.migrations[version];
                const validationSchema = this.validationSchemas[version];

                // Validate before migration
                const validationResult = validationSchema.validate(migratedConfig);
                if (!validationResult.success) {
                    throw new Error(`Pre-migration validation failed for version ${version}: ${validationResult.error.message}`);
                }

                // Perform migration
                migratedConfig = migration.up(migratedConfig);
                migratedConfig.version = version;
                migratedConfig.lastModified = new Date().toISOString();

                // Validate after migration
                const postValidationResult = validationSchema.validate(migratedConfig);
                if (!postValidationResult.success) {
                    throw new Error(`Post-migration validation failed for version ${version}: ${postValidationResult.error.message}`);
                }

                // Validate transition
                const transitionResult = validationSchema.validateTransition(migratedConfig, migratedConfig);
                if (!transitionResult.valid) {
                    throw new Error(`Transition validation failed for version ${version}: ${transitionResult.error}`);
                }
            }
        } else {
            // Migrate down
            for (let i = currentIndex; i > targetIndex; i--) {
                const version = versions[i - 1];
                const migration = this.migrations[version];
                const validationSchema = this.validationSchemas[version];

                // Validate before migration
                const validationResult = validationSchema.validate(migratedConfig);
                if (!validationResult.success) {
                    throw new Error(`Pre-migration validation failed for version ${version}: ${validationResult.error.message}`);
                }

                // Perform migration
                migratedConfig = migration.down(migratedConfig);
                migratedConfig.version = version;
                migratedConfig.lastModified = new Date().toISOString();

                // Validate after migration
                const postValidationResult = validationSchema.validate(migratedConfig);
                if (!postValidationResult.success) {
                    throw new Error(`Post-migration validation failed for version ${version}: ${postValidationResult.error.message}`);
                }

                // Validate transition
                const transitionResult = validationSchema.validateTransition(migratedConfig, migratedConfig);
                if (!transitionResult.valid) {
                    throw new Error(`Transition validation failed for version ${version}: ${transitionResult.error}`);
                }
            }
        }

        return migratedConfig;
    }

    async loadConfig() {
        try {
            const config = await this.storage.get('config');
            if (!config) {
                return this.getDefaultConfig();
            }

            // Validate the loaded config
            const result = this.schema.safeParse(config);
            if (!result.success) {
                console.warn('Invalid config format:', result.error);
                return this.getDefaultConfig();
            }

            // Check if migration is needed
            const currentVersion = result.data.version;
            const targetVersion = this.getDefaultConfig().version;

            if (currentVersion !== targetVersion) {
                try {
                    const migratedConfig = await this.migrateConfig(result.data, targetVersion);
                    await this.saveConfig(migratedConfig);
                    return migratedConfig;
                } catch (error) {
                    console.error('Failed to migrate config:', error);
                    return this.getDefaultConfig();
                }
            }

            return result.data;
        } catch (error) {
            console.error('Failed to load config:', error);
            return this.getDefaultConfig();
        }
    }

    async saveConfig(config) {
        try {
            const result = this.schema.safeParse(config);
            if (!result.success) {
                throw new Error(`Invalid config format: ${result.error.message}`);
            }

            await this.storage.set('config', result.data);
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
    }

    async resetConfig() {
        try {
            const defaultConfig = this.getDefaultConfig();
            await this.saveConfig(defaultConfig);
            return defaultConfig;
        } catch (error) {
            console.error('Failed to reset config:', error);
            throw error;
        }
    }

    getDefaultConfig() {
        return {
            version: '1.0.0',
            lastModified: new Date().toISOString(),
            metadata: {
                description: 'Default monitoring configuration',
                author: 'system',
                tags: ['default'],
                environment: 'production'
            },
            thresholds: {
                cpu: 80,
                memory: 85,
                latency: 1000,
                disk: 90,
                network: 75
            },
            alerts: {
                enabled: true,
                email: {
                    enabled: true,
                    recipients: ['admin@example.com'],
                    severity: 'warning',
                    cooldown: 300
                },
                slack: {
                    enabled: true,
                    webhook: 'https://hooks.slack.com/services/xxx/yyy/zzz',
                    channel: '#monitoring',
                    username: 'Monitoring Bot'
                }
            },
            autoScaling: {
                enabled: true,
                minInstances: 2,
                maxInstances: 10,
                scaleUpThreshold: 75,
                scaleDownThreshold: 25,
                rules: [
                    {
                        metric: 'cpu',
                        threshold: 75,
                        cooldown: 300,
                        step: 1
                    }
                ],
                cooldown: 300
            },
            retention: {
                enabled: true,
                maxAge: 30 * 24 * 60 * 60, // 30 days
                maxSize: 1024 * 1024 * 1024, // 1GB
                compression: true
            },
            display: {
                theme: 'system',
                refreshInterval: 5,
                showP95: true,
                showP99: true,
                historicalDataPoints: 50,
                timeRange: '24h',
                charts: ['cpu', 'memory', 'latency', 'requests', 'errors']
            },
            features: {
                anomalyDetection: true,
                predictiveScaling: false,
                costOptimization: true,
                customMetrics: []
            }
        };
    }

    async close() {
        if (this.storage) {
            await this.storage.close();
        }
    }
}

export default ConfigStorage; 