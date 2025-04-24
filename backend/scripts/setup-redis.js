const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function setupRedis() {
    try {
        console.log('🚀 Setting up Redis for development...');

        // Check if Docker is running
        try {
            await execAsync('docker ps');
        } catch (error) {
            console.error('❌ Docker is not running. Please start Docker and try again.');
            process.exit(1);
        }

        // Check if Redis container exists and is running
        try {
            const { stdout } = await execAsync('docker ps -a --format "{{.Names}}:{{.Status}}" | grep redis');
            const [name, status] = stdout.split(':');

            if (status.includes('Up')) {
                console.log('✅ Redis container is already running');
            } else {
                console.log('Starting existing Redis container...');
                await execAsync('docker start redis');
                console.log('✅ Redis container started');
            }
        } catch (error) {
            // Container doesn't exist, create it
            console.log('Creating Redis container...');
            try {
                await execAsync('docker run --name redis -p 6379:6379 -d redis:7-alpine');
                console.log('✅ Redis container created');
            } catch (createError) {
                if (createError.message.includes('Conflict')) {
                    console.log('Redis container exists but is not running. Starting it...');
                    await execAsync('docker start redis');
                    console.log('✅ Redis container started');
                } else {
                    throw createError;
                }
            }
        }

        // Test Redis connection
        try {
            await execAsync('docker exec redis redis-cli ping');
            console.log('✅ Redis connection test successful');
        } catch (error) {
            console.error('❌ Redis connection test failed:', error.message);
            process.exit(1);
        }

        console.log('✨ Redis setup completed successfully!');
    } catch (error) {
        console.error('❌ Redis setup failed:', error.message);
        process.exit(1);
    }
}

setupRedis(); 