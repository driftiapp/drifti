const mongoose = require('mongoose');
const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis(config.redis.url);

const checkDatabase = async () => {
  try {
    const state = mongoose.connection.readyState;
    return state === 1; // 1 = connected
  } catch (error) {
    return false;
  }
};

const checkRedis = async () => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
};

const checkFirebase = async () => {
  try {
    const admin = require('firebase-admin');
    await admin.auth().listUsers(1);
    return true;
  } catch (error) {
    return false;
  }
};

const getHealthStatus = async () => {
  const [database, redis, firebase] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkFirebase()
  ]);

  const status = {
    status: database && redis && firebase ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: database ? 'up' : 'down',
        lastChecked: new Date().toISOString()
      },
      redis: {
        status: redis ? 'up' : 'down',
        lastChecked: new Date().toISOString()
      },
      firebase: {
        status: firebase ? 'up' : 'down',
        lastChecked: new Date().toISOString()
      }
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env
  };

  // Cache health status in Redis
  await redis.set('health_status', JSON.stringify(status), 'EX', 60);

  return status;
};

module.exports = {
  getHealthStatus,
  checkDatabase,
  checkRedis,
  checkFirebase
}; 