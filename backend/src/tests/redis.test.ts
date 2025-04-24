import redisService from '../services/redisService';

describe('Redis Service', () => {
    beforeAll(async () => {
        // Ensure Redis is connected before tests
        await redisService.ping();
    });

    afterAll(async () => {
        // Clean up Redis connection
        await redisService.quit();
    });

    beforeEach(async () => {
        // Clear Redis before each test
        await redisService.flushall();
    });

    describe('Basic Operations', () => {
        it('should set and get values', async () => {
            const testKey = 'test:key';
            const testValue = { message: 'Hello Redis!' };

            await redisService.set(testKey, testValue);
            const retrievedValue = await redisService.get(testKey);

            expect(retrievedValue).toEqual(testValue);
        });

        it('should delete values', async () => {
            const testKey = 'test:key';
            const testValue = { message: 'Hello Redis!' };

            await redisService.set(testKey, testValue);
            await redisService.delete(testKey);
            const retrievedValue = await redisService.get(testKey);

            expect(retrievedValue).toBeNull();
        });

        it('should handle TTL correctly', async () => {
            const testKey = 'test:ttl';
            const testValue = { message: 'TTL Test' };

            await redisService.set(testKey, testValue, 1); // 1 second TTL

            // Value should exist immediately
            const immediateValue = await redisService.get(testKey);
            expect(immediateValue).toEqual(testValue);

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Value should be gone after TTL
            const expiredValue = await redisService.get(testKey);
            expect(expiredValue).toBeNull();
        });

        it('should handle null values gracefully', async () => {
            const testKey = 'test:null';
            const nullValue = await redisService.get(testKey);
            expect(nullValue).toBeNull();
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid JSON gracefully', async () => {
            const testKey = 'test:invalid';

            // Manually set invalid JSON using the client getter
            await redisService.client.set(testKey, 'invalid-json');

            // Should return null for invalid JSON
            const value = await redisService.get(testKey);
            expect(value).toBeNull();
        });

        it('should handle connection errors gracefully', async () => {
            // Simulate connection error by disconnecting
            await redisService.disconnect();

            const result = await redisService.ping();
            expect(result).toBe(false);

            // Reconnect for other tests
            await redisService.connect();
        });

        it('should handle operation errors', async () => {
            // Simulate operation error by disconnecting
            await redisService.disconnect();

            await expect(redisService.set('key', 'value')).rejects.toThrow();
            await expect(redisService.get('key')).rejects.toThrow();
            await expect(redisService.delete('key')).rejects.toThrow();
            await expect(redisService.flushall()).rejects.toThrow();

            // Reconnect for other tests
            await redisService.connect();
        });
    });

    describe('Pub/Sub Operations', () => {
        it('should publish and receive messages', async () => {
            const channel = 'test:channel';
            const message = { data: 'test message' };

            // Create a promise to wait for the message
            const messagePromise = new Promise(resolve => {
                redisService.subscribe(channel, (receivedMessage) => {
                    resolve(receivedMessage);
                });
            });

            // Publish message after subscription is set up
            setTimeout(() => {
                redisService.publish(channel, message);
            }, 100);

            const receivedMessage = await messagePromise;
            expect(receivedMessage).toEqual(message);
        });

        it('should handle invalid messages in pub/sub', async () => {
            const channel = 'test:invalid';

            // Subscribe to channel
            await redisService.subscribe(channel, () => { });

            // Publish invalid JSON
            await redisService.client.publish(channel, 'invalid-json');

            // Wait for message processing
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should handle pub/sub errors', async () => {
            const channel = 'test:error';
            const message = { data: 'test' };

            // Disconnect publisher
            await redisService.disconnect();

            await expect(redisService.publish(channel, message)).rejects.toThrow();
            await expect(redisService.subscribe(channel, () => { })).rejects.toThrow();

            // Reconnect for other tests
            await redisService.connect();
        });
    });

    describe('Cleanup', () => {
        it('should handle quit errors gracefully', async () => {
            // Already disconnected client should handle quit gracefully
            await redisService.disconnect();
            await redisService.quit();

            // Reconnect for other tests
            await redisService.connect();
        });
    });
}); 