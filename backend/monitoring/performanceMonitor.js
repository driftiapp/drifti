const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis(config.redis.url);

const trackPerformance = async (metric) => {
  const {
    name,
    value,
    tags = {},
    timestamp = Date.now()
  } = metric;

  const key = `performance:${name}:${timestamp}`;
  const data = {
    value,
    tags,
    timestamp
  };

  // Store in Redis with 24h expiry
  await redis.set(key, JSON.stringify(data), 'EX', 86400);

  // Add to time series
  await redis.zadd(`performance:${name}:series`, timestamp, JSON.stringify(data));

  // Trim old data (keep last 7 days)
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  await redis.zremrangebyscore(`performance:${name}:series`, 0, cutoff);
};

const getPerformanceMetrics = async (name, timeRange = '1h') => {
  const now = Date.now();
  let startTime;

  switch (timeRange) {
    case '1h':
      startTime = now - (60 * 60 * 1000);
      break;
    case '24h':
      startTime = now - (24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = now - (7 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = now - (60 * 60 * 1000); // Default to 1h
  }

  const data = await redis.zrangebyscore(
    `performance:${name}:series`,
    startTime,
    now
  );

  return data.map(item => JSON.parse(item));
};

const getAggregatedMetrics = async (name, timeRange = '1h') => {
  const metrics = await getPerformanceMetrics(name, timeRange);
  
  if (metrics.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      count: 0
    };
  }

  const values = metrics.map(m => m.value);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    count: values.length
  };
};

module.exports = {
  trackPerformance,
  getPerformanceMetrics,
  getAggregatedMetrics
}; 