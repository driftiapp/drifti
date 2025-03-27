const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { verifyDeployment } = require('./verify-deployment');

const BACKUP_DIR = path.join(__dirname, '../backups');
const ROLLBACK_DIR = path.join(__dirname, '../rollbacks');

class DeploymentRollback {
  constructor() {
    this.backupDir = BACKUP_DIR;
    this.rollbackDir = ROLLBACK_DIR;
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.backupDir, this.rollbackDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async createBackup() {
    console.log('Creating deployment backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `deployment-${timestamp}`);

    try {
      // Backup frontend build
      execSync(`cp -r frontend/.next ${backupPath}/frontend-next`);
      execSync(`cp -r frontend/out ${backupPath}/frontend-out`);

      // Backup backend build
      execSync(`cp -r backend/dist ${backupPath}/backend-dist`);

      // Backup environment files
      execSync(`cp frontend/.env ${backupPath}/frontend-env`);
      execSync(`cp backend/.env ${backupPath}/backend-env`);

      // Backup package files
      execSync(`cp frontend/package.json ${backupPath}/frontend-package.json`);
      execSync(`cp backend/package.json ${backupPath}/backend-package.json`);

      console.log('Backup created successfully:', backupPath);
      return backupPath;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  async performRollback(backupPath) {
    console.log('Performing rollback...');
    try {
      // Restore frontend build
      execSync(`rm -rf frontend/.next`);
      execSync(`rm -rf frontend/out`);
      execSync(`cp -r ${backupPath}/frontend-next frontend/.next`);
      execSync(`cp -r ${backupPath}/frontend-out frontend/out`);

      // Restore backend build
      execSync(`rm -rf backend/dist`);
      execSync(`cp -r ${backupPath}/backend-dist backend/dist`);

      // Restore environment files
      execSync(`cp ${backupPath}/frontend-env frontend/.env`);
      execSync(`cp ${backupPath}/backend-env backend/.env`);

      // Restore package files
      execSync(`cp ${backupPath}/frontend-package.json frontend/package.json`);
      execSync(`cp ${backupPath}/backend-package.json backend/package.json`);

      // Reinstall dependencies
      execSync('cd frontend && npm install');
      execSync('cd backend && npm install');

      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  async verifyRollback() {
    console.log('Verifying rollback...');
    try {
      await verifyDeployment();
      console.log('Rollback verification successful');
    } catch (error) {
      console.error('Rollback verification failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(f => f.startsWith('deployment-'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          timestamp: f.replace('deployment-', '')
        }))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  }

  async cleanupOldBackups(maxBackups = 5) {
    try {
      const backups = await this.listBackups();
      if (backups.length > maxBackups) {
        const oldBackups = backups.slice(maxBackups);
        for (const backup of oldBackups) {
          fs.rmSync(backup.path, { recursive: true, force: true });
          console.log(`Cleaned up old backup: ${backup.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const rollback = new DeploymentRollback();
  
  // Example usage:
  // Create backup before deployment
  rollback.createBackup()
    .then(backupPath => {
      console.log('Backup created at:', backupPath);
      
      // If deployment fails, perform rollback
      return rollback.performRollback(backupPath);
    })
    .then(() => {
      return rollback.verifyRollback();
    })
    .then(() => {
      return rollback.cleanupOldBackups();
    })
    .catch(console.error);
}

module.exports = DeploymentRollback; 