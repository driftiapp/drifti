import { Redis } from '@upstash/redis'

interface LogEntry {
    timestamp: number
    level: 'info' | 'warn' | 'error'
    message: string
    metadata?: Record<string, any>
}

interface AuthLogStats {
    totalLogs: number
    errorRate: number
    warningRate: number
    recentErrors: LogEntry[]
    recentWarnings: LogEntry[]
    userActivity: Record<string, number>
}

export class AuthLogger {
    private redis: Redis
    private readonly logKey: string
    private readonly maxLogs: number

    constructor(redis: Redis, maxLogs: number = 1000) {
        this.redis = redis
        this.logKey = 'auth:logs'
        this.maxLogs = maxLogs
    }

    async log(level: LogEntry['level'], message: string, metadata?: Record<string, any>) {
        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            message,
            metadata
        }

        try {
            await this.redis.lpush(this.logKey, JSON.stringify(entry))
            await this.redis.ltrim(this.logKey, 0, this.maxLogs - 1)
        } catch (error) {
            console.error('Failed to log entry:', error)
        }
    }

    async info(message: string, metadata?: Record<string, any>) {
        await this.log('info', message, metadata)
    }

    async warn(message: string, metadata?: Record<string, any>) {
        await this.log('warn', message, metadata)
    }

    async error(message: string, metadata?: Record<string, any>) {
        await this.log('error', message, metadata)
    }

    async getLogs(limit: number = 100): Promise<LogEntry[]> {
        try {
            const logs = await this.redis.lrange(this.logKey, 0, limit - 1)
            return logs.map(log => JSON.parse(log))
        } catch (error) {
            console.error('Failed to get logs:', error)
            return []
        }
    }

    async getStats(): Promise<AuthLogStats> {
        const logs = await this.getLogs(this.maxLogs)
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000

        const recentLogs = logs.filter(log => log.timestamp >= oneDayAgo)
        const errors = recentLogs.filter(log => log.level === 'error')
        const warnings = recentLogs.filter(log => log.level === 'warn')

        const userActivity: Record<string, number> = {}
        recentLogs.forEach(log => {
            if (log.metadata?.userId) {
                userActivity[log.metadata.userId] = (userActivity[log.metadata.userId] || 0) + 1
            }
        })

        return {
            totalLogs: logs.length,
            errorRate: logs.length > 0 ? (errors.length / logs.length) * 100 : 0,
            warningRate: logs.length > 0 ? (warnings.length / logs.length) * 100 : 0,
            recentErrors: errors.slice(0, 10),
            recentWarnings: warnings.slice(0, 10),
            userActivity
        }
    }

    async clearLogs(): Promise<void> {
        try {
            await this.redis.del(this.logKey)
        } catch (error) {
            console.error('Failed to clear logs:', error)
        }
    }
} 