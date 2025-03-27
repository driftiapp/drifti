const Queue = require('bull');
const EmailService = require('./EmailService');
const Sentry = require('@sentry/node');

class EmailQueueService {
    constructor() {
        this.emailQueue = new Queue('email-queue', process.env.REDIS_URL, {
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        });

        // Process jobs
        this.emailQueue.process(async (job) => {
            try {
                const { type, data } = job.data;
                
                switch (type) {
                    case 'reservationConfirmation':
                        await EmailService.sendReservationConfirmation(data);
                        break;
                    case 'paymentConfirmation':
                        await EmailService.sendPaymentConfirmation(data);
                        break;
                    case 'passwordReset':
                        await EmailService.sendPasswordReset(data.email, data.resetToken);
                        break;
                    case 'businessNotification':
                        await EmailService.sendBusinessNotification(data);
                        break;
                    case 'supportEmail':
                        await EmailService.sendSupportEmail(data);
                        break;
                    default:
                        throw new Error(`Unknown email type: ${type}`);
                }
            } catch (error) {
                Sentry.captureException(error, {
                    extra: {
                        jobId: job.id,
                        emailType: job.data.type
                    }
                });
                throw error;
            }
        });

        // Handle failed jobs
        this.emailQueue.on('failed', (job, error) => {
            Sentry.captureException(error, {
                extra: {
                    jobId: job.id,
                    emailType: job.data.type,
                    attempts: job.attemptsMade
                }
            });
        });

        // Handle completed jobs
        this.emailQueue.on('completed', (job) => {
            console.log(`Email job ${job.id} completed successfully`);
        });
    }

    async addToQueue(type, data) {
        try {
            const job = await this.emailQueue.add({
                type,
                data
            });
            return job.id;
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    emailType: type,
                    data
                }
            });
            throw error;
        }
    }

    async getQueueStatus() {
        const [waiting, active, completed, failed] = await Promise.all([
            this.emailQueue.getWaitingCount(),
            this.emailQueue.getActiveCount(),
            this.emailQueue.getCompletedCount(),
            this.emailQueue.getFailedCount()
        ]);

        return {
            waiting,
            active,
            completed,
            failed
        };
    }

    async retryFailedJobs() {
        const failedJobs = await this.emailQueue.getFailed();
        for (const job of failedJobs) {
            await job.retry();
        }
    }

    async cleanOldJobs() {
        const completedJobs = await this.emailQueue.getCompleted();
        const failedJobs = await this.emailQueue.getFailed();
        
        // Remove jobs older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        for (const job of [...completedJobs, ...failedJobs]) {
            if (job.finishedOn < sevenDaysAgo) {
                await job.remove();
            }
        }
    }
}

module.exports = new EmailQueueService(); 