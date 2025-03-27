class TemplatePreview {
    constructor() {
        this.defaultValues = {
            message: 'System alert: High CPU usage detected',
            timestamp: new Date().toISOString(),
            severity: 'warning',
            details: {
                metric: 'cpu',
                value: 85,
                threshold: 80,
                instance: 'server-1',
                region: 'us-east-1'
            },
            metadata: {
                environment: 'production',
                service: 'monitoring',
                version: '1.0.0',
                tags: ['high-priority', 'performance']
            }
        };
    }

    generatePreview(template, type, customValues = {}) {
        if (!template) return null;

        try {
            // Merge default values with custom values
            const values = {
                ...this.defaultValues,
                ...customValues
            };

            // Replace placeholders with actual values
            let preview = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                const trimmedKey = key.trim();
                if (trimmedKey.includes('|')) {
                    // Handle filters
                    const [variable, filter] = trimmedKey.split('|').map(s => s.trim());
                    return this.applyFilter(this.getValue(variable, values), filter);
                }
                return this.getValue(trimmedKey, values);
            });

            // Handle conditional blocks
            preview = this.processConditionals(preview, values);

            // Handle loops
            preview = this.processLoops(preview, values);

            // Format based on alert type
            return this.formatPreview(preview, type);
        } catch (error) {
            console.error('Failed to generate preview:', error);
            return null;
        }
    }

    getValue(key, values) {
        // Handle nested object paths (e.g., "details.metric")
        return key.split('.').reduce((obj, k) => obj?.[k], values) ?? `{{${key}}}`;
    }

    applyFilter(value, filter) {
        switch (filter.toLowerCase()) {
            case 'uppercase':
                return String(value).toUpperCase();
            case 'lowercase':
                return String(value).toLowerCase();
            case 'capitalize':
                return String(value).replace(/\b\w/g, l => l.toUpperCase());
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'time':
                return new Date(value).toLocaleTimeString();
            case 'datetime':
                return new Date(value).toLocaleString();
            case 'number':
                return Number(value).toLocaleString();
            case 'percentage':
                return `${Number(value).toFixed(1)}%`;
            case 'bytes':
                return this.formatBytes(value);
            case 'duration':
                return this.formatDuration(value);
            default:
                return value;
        }
    }

    processConditionals(template, values) {
        return template.replace(/\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (match, condition, content) => {
            const value = this.getValue(condition.trim(), values);
            return value ? content : '';
        });
    }

    processLoops(template, values) {
        return template.replace(/\{%\s*for\s+(\w+)\s+in\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g, (match, item, collection, content) => {
            const items = this.getValue(collection.trim(), values);
            if (!Array.isArray(items)) return '';
            return items.map(itemValue => {
                const itemValues = { ...values, [item]: itemValue };
                return this.generatePreview(content, 'text', itemValues);
            }).join('');
        });
    }

    formatPreview(preview, type) {
        switch (type) {
            case 'email':
                return {
                    subject: preview.split('\n')[0],
                    body: preview.split('\n').slice(1).join('\n'),
                    html: this.convertToHtml(preview)
                };
            case 'slack':
                return {
                    blocks: this.convertToSlackBlocks(preview)
                };
            case 'webhook':
                return {
                    body: preview,
                    json: this.convertToJson(preview)
                };
            default:
                return preview;
        }
    }

    convertToHtml(text) {
        return text
            .split('\n')
            .map(line => `<p>${line}</p>`)
            .join('\n');
    }

    convertToSlackBlocks(text) {
        return [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: text
                }
            }
        ];
    }

    convertToJson(text) {
        try {
            return JSON.stringify({ message: text }, null, 2);
        } catch {
            return JSON.stringify({ message: text });
        }
    }

    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = Number(bytes);
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        return `${value.toFixed(1)} ${units[unitIndex]}`;
    }

    formatDuration(seconds) {
        const units = [
            { value: 60 * 60 * 24, label: 'd' },
            { value: 60 * 60, label: 'h' },
            { value: 60, label: 'm' },
            { value: 1, label: 's' }
        ];

        let value = Number(seconds);
        const parts = [];

        for (const unit of units) {
            if (value >= unit.value) {
                const count = Math.floor(value / unit.value);
                parts.push(`${count}${unit.label}`);
                value %= unit.value;
            }
        }

        return parts.join(' ') || '0s';
    }
}

export default TemplatePreview; 