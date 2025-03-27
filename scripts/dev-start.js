const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

// Function to check if MongoDB is running
async function checkMongoDB() {
    try {
        await execAsync('mongod --version');
    } catch (error) {
        console.error('❌ MongoDB is not installed. Please install MongoDB first.');
        process.exit(1);
    }

    try {
        // Try to connect to MongoDB
        await execAsync('mongod --version');
    } catch (error) {
        console.log('Starting MongoDB...');
        const mongoPath = path.join(process.cwd(), 'data', 'db');
        spawn('mongod', ['--dbpath', mongoPath], {
            stdio: 'inherit'
        });
        // Wait for MongoDB to start
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

// Function to check if Node.js and npm are installed
async function checkNode() {
    try {
        await execAsync('node --version');
        await execAsync('npm --version');
    } catch (error) {
        console.error('❌ Node.js or npm is not installed. Please install them first.');
        process.exit(1);
    }
}

// Function to install dependencies
async function installDependencies() {
    console.log('Installing backend dependencies...');
    await execAsync('cd backend && npm install');

    console.log('Installing frontend dependencies...');
    await execAsync('cd frontend && npm install');
}

// Function to check and create necessary directories
function setupDirectories() {
    const dirs = [
        path.join(process.cwd(), 'data', 'db'),
        path.join(process.cwd(), 'backend', 'uploads'),
        path.join(process.cwd(), 'logs')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Function to start the development servers
function startServers() {
    // Start backend server
    console.log('Starting backend server...');
    const backend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(process.cwd(), 'backend'),
        stdio: 'inherit'
    });

    // Wait for backend to start
    setTimeout(() => {
        // Start frontend server
        console.log('Starting frontend server...');
        const frontend = spawn('npm', ['run', 'dev'], {
            cwd: path.join(process.cwd(), 'frontend'),
            stdio: 'inherit'
        });

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\nShutting down servers...');
            backend.kill();
            frontend.kill();
            process.exit();
        });
    }, 5000);
}

// Main execution
async function main() {
    console.log('🚀 Starting Drifti development environment...');

    try {
        // Check requirements
        await checkNode();
        await checkMongoDB();

        // Setup directories
        console.log('Setting up directories...');
        setupDirectories();

        // Install dependencies if needed
        if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
            console.log('Installing dependencies...');
            await installDependencies();
        }

        // Start development servers
        startServers();

        // Print success message
        console.log(`
✅ Drifti development environment is running!

Frontend: http://localhost:3000
Backend:  http://localhost:5000
API Docs: http://localhost:5000/api-docs

Press Ctrl+C to stop all servers.
        `);
    } catch (error) {
        console.error('Failed to start development environment:', error);
        process.exit(1);
    }
}

main(); 