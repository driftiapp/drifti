const mongoose = require('mongoose');
const { performance } = require('perf_hooks');

class HealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.lastCheck = null;
    this.checks = new Map();
  }

  async checkDatabase() {
    try {
      const start = performance.now();
      await mongoose.connection.db.admin().ping();
      const end = performance.now();
      return {
        status: 'healthy',
        latency: end - start,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  async checkFirebase() {
    try {
      const start = performance.now();
      // Add Firebase health check logic here
      const end = performance.now();
      return {
        status: 'healthy',
        latency: end - start,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  async checkMemory() {
    const used = process.memoryUsage();
    return {
      status: 'healthy',
      heapUsed: used.heapUsed,
      heapTotal: used.heapTotal,
      external: used.external,
      timestamp: new Date(),
    };
  }

  async runChecks() {
    this.lastCheck = new Date();
    const checks = {
      database: await this.checkDatabase(),
      firebase: await this.checkFirebase(),
      memory: await this.checkMemory(),
      uptime: process.uptime(),
    };

    this.checks.set(this.lastCheck, checks);
    return checks;
  }

  getStatus() {
    return {
      startTime: this.startTime,
      lastCheck: this.lastCheck,
      checks: Array.from(this.checks.entries()),
    };
  }
}

module.exports = new HealthCheck(); 