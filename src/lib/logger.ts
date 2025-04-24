import { prisma } from '@/lib/prisma';
import { subDays, subWeeks, subMonths, format } from 'date-fns';

interface DownloadLog {
  id: string;
  userId: string | null;
  fileId: string;
  filename: string;
  speed: number;
  status: string;
  error: string | null;
  timestamp: Date;
}

interface ErrorStats {
  errorRate: number;
  totalErrors: number;
  totalDownloads: number;
  errorTypes: Array<{
    type: string;
    count: number;
    percentage: number;
    lastOccurrence: Date;
  }>;
  errorTrends: Array<{
    period: string;
    count: number;
    type: string;
  }>;
}

interface SpeedStats {
  averageSpeed: number;
  minSpeed: number;
  maxSpeed: number;
  speedTrends: Array<{
    period: string;
    averageSpeed: number;
    count: number;
  }>;
  speedDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

interface TimelineData {
  date: string;
  downloads: number;
  successful: number;
  failed: number;
  averageSpeed: number;
  errorRate: number;
}

export class DownloadLogger {
  private static instance: DownloadLogger;
  private downloads: Map<string, {
    count: number;
    lastDownload: Date;
    successfulDownloads: number;
    failedDownloads: number;
    totalSize: number;
    totalTime: number;
    minSpeed: number;
    maxSpeed: number;
    errorTypes: Map<string, {
      count: number;
      lastOccurrence: Date;
    }>;
  }>;

  private constructor() {
    this.downloads = new Map();
  }

  public static getInstance(): DownloadLogger {
    if (!DownloadLogger.instance) {
      DownloadLogger.instance = new DownloadLogger();
    }
    return DownloadLogger.instance;
  }

  public logDownload(
    filename: string,
    success: boolean,
    size: number,
    downloadTime?: number,
    errorType?: string,
    errorDetails?: Record<string, any>
  ): void {
    const stats = this.downloads.get(filename) || {
      count: 0,
      lastDownload: new Date(),
      successfulDownloads: 0,
      failedDownloads: 0,
      totalSize: 0,
      totalTime: 0,
      minSpeed: Infinity,
      maxSpeed: 0,
      errorTypes: new Map()
    };

    stats.count++;
    stats.lastDownload = new Date();
    if (success && downloadTime) {
      stats.successfulDownloads++;
      stats.totalTime += downloadTime;
      const speed = size / (downloadTime / 1000) / (1024 * 1024); // MB/s
      stats.minSpeed = Math.min(stats.minSpeed, speed);
      stats.maxSpeed = Math.max(stats.maxSpeed, speed);
    } else {
      stats.failedDownloads++;
      if (errorType) {
        const errorStats = stats.errorTypes.get(errorType) || {
          count: 0,
          lastOccurrence: new Date()
        };
        errorStats.count++;
        errorStats.lastOccurrence = new Date();
        stats.errorTypes.set(errorType, errorStats);
      }
    }
    stats.totalSize += size;

    this.downloads.set(filename, stats);
  }

  public getDownloadStats(filename: string): {
    count: number;
    lastDownload: Date;
    successfulDownloads: number;
    failedDownloads: number;
    totalSize: number;
    averageSize: number;
    averageSpeed: number;
    minSpeed: number;
    maxSpeed: number;
    errorTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  } {
    const stats = this.downloads.get(filename);
    if (!stats) {
      return {
        count: 0,
        lastDownload: new Date(),
        successfulDownloads: 0,
        failedDownloads: 0,
        totalSize: 0,
        averageSize: 0,
        averageSpeed: 0,
        minSpeed: 0,
        maxSpeed: 0,
        errorTypes: []
      };
    }

    const errorTypes = Array.from(stats.errorTypes.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      percentage: (data.count / stats.failedDownloads) * 100
    }));

    return {
      ...stats,
      averageSize: stats.count > 0 ? stats.totalSize / stats.count : 0,
      averageSpeed: stats.successfulDownloads > 0 ? stats.totalSize / (stats.totalTime / 1000) / (1024 * 1024) : 0,
      errorTypes
    };
  }

  public async getSpeedStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<SpeedStats> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    const speedStats = await prisma.downloadLog.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: startDate,
        },
        status: '200',
      },
      _count: {
        _all: true,
      },
      _avg: {
        speed: true,
      },
    });

    const speedTrends = speedStats.map(stat => ({
      period: new Date(stat.timestamp).toISOString().split('T')[0],
      averageSpeed: stat._avg?.speed || 0,
      count: stat._count?._all || 0,
    }));

    const speedDistribution = await this.getSpeedDistribution(startDate);

    return {
      averageSpeed: speedTrends.reduce((sum, trend) => sum + trend.averageSpeed, 0) / speedTrends.length,
      minSpeed: Math.min(...speedTrends.map(trend => trend.averageSpeed)),
      maxSpeed: Math.max(...speedTrends.map(trend => trend.averageSpeed)),
      speedTrends,
      speedDistribution,
    };
  }

  public async getTimelineData(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<TimelineData[]> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = subDays(now, 1);
        break;
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
    }

    const timelineData = await prisma.downloadLog.groupBy({
      by: ['timestamp', 'status'],
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        _all: true,
      },
      _avg: {
        speed: true,
      },
    });

    // Group by date and calculate success/failure counts
    const dailyStats = timelineData.reduce((acc, data) => {
      const date = format(new Date(data.timestamp), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          total: 0,
          successful: 0,
          failed: 0,
          averageSpeed: 0,
        };
      }

      const count = data._count?._all || 0;
      acc[date].total += count;
      if (data.status === 'success') {
        acc[date].successful += count;
        acc[date].averageSpeed = data._avg?.speed || 0;
      } else {
        acc[date].failed += count;
      }

      return acc;
    }, {} as Record<string, { total: number; successful: number; failed: number; averageSpeed: number }>);

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      downloads: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      averageSpeed: stats.averageSpeed,
      errorRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
    }));
  }

  private async getSpeedDistribution(startDate: Date): Promise<Array<{ range: string; count: number; percentage: number }>> {
    const speeds = await prisma.downloadLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
        status: 'success',
        speed: {
          gt: 0,
        },
      },
      select: {
        speed: true,
      },
    });

    const speedRanges = [
      { min: 0, max: 1, label: '< 1 MB/s' },
      { min: 1, max: 5, label: '1-5 MB/s' },
      { min: 5, max: 10, label: '5-10 MB/s' },
      { min: 10, max: Infinity, label: '> 10 MB/s' },
    ];

    const distribution = speedRanges.map(range => {
      const count = speeds.filter(speed => {
        const speedValue = speed.speed;
        return speedValue >= range.min && speedValue < range.max;
      }).length;

      return {
        range: range.label,
        count,
        percentage: speeds.length > 0 ? (count / speeds.length) * 100 : 0,
      };
    });

    return distribution;
  }

  public async getRecentDownloads(limit: number = 10): Promise<DownloadLog[]> {
    return prisma.downloadLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  public async getErrorStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<ErrorStats> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    const [errorStats, totalDownloads] = await Promise.all([
      prisma.downloadLog.groupBy({
        by: ['status', 'error'],
        where: {
          timestamp: {
            gte: startDate,
          },
          status: {
            not: 'success',
          },
        },
        _count: {
          _all: true,
        },
        _max: {
          timestamp: true,
        },
      }),
      prisma.downloadLog.count({
        where: {
          timestamp: {
            gte: startDate,
          },
        },
      }),
    ]);

    const errorTypes = errorStats.map(stat => ({
      type: stat.error || 'Unknown',
      count: stat._count?._all || 0,
      percentage: (stat._count?._all || 0) / totalDownloads * 100,
      lastOccurrence: stat._max?.timestamp || new Date(),
    }));

    const errorTrends = await this.getErrorTrends(startDate);

    return {
      errorRate: (errorTypes.reduce((sum, type) => sum + type.count, 0) / totalDownloads) * 100,
      totalErrors: errorTypes.reduce((sum, type) => sum + type.count, 0),
      totalDownloads,
      errorTypes,
      errorTrends,
    };
  }

  private async getErrorTrends(startDate: Date): Promise<Array<{ period: string; count: number; type: string }>> {
    const trends = await prisma.downloadLog.groupBy({
      by: ['status', 'error', 'timestamp'],
      where: {
        timestamp: {
          gte: startDate,
        },
        status: {
          not: 'success',
        },
      },
      _count: {
        _all: true,
      },
    });

    return trends.map(trend => ({
      period: new Date(trend.timestamp).toISOString().split('T')[0],
      count: trend._count?._all || 0,
      type: trend.error || 'Unknown',
    }));
  }
} 