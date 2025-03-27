const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const EmailNotification = require('../templates/EmailNotification');
const { trackError } = require('../monitoring/errorMonitor');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Load email templates
        this.templates = {
            reservationConfirmation: null,
            paymentReceived: null,
            verification: (code) => ({
                subject: 'Verify your email address',
                html: `
                    <h1>Welcome to DriftiX!</h1>
                    <p>Thank you for registering. Please use the following code to verify your email address:</p>
                    <h2 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${code}</h2>
                    <p>This code will expire in 24 hours.</p>
                    <p>If you didn't create an account, you can safely ignore this email.</p>
                `
            }),
            passwordReset: (resetLink) => ({
                subject: 'Reset your password',
                html: `
                    <h1>Password Reset Request</h1>
                    <p>You requested to reset your password. Click the link below to set a new password:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                `
            })
        };
    }

    async loadTemplates() {
        try {
            const reservationTemplate = await fs.readFile(
                path.join(__dirname, '../templates/reservation-confirmation.hbs'),
                'utf-8'
            );
            const paymentTemplate = await fs.readFile(
                path.join(__dirname, '../templates/payment-received.hbs'),
                'utf-8'
            );

            this.templates.reservationConfirmation = handlebars.compile(reservationTemplate);
            this.templates.paymentReceived = handlebars.compile(paymentTemplate);
        } catch (error) {
            console.error('Error loading email templates:', error);
        }
    }

    async sendReservationConfirmation(data) {
        const {
            customerName,
            service,
            location,
            date,
            bookingId,
            amount,
            paymentStatus,
            perks,
            corporateBenefits,
            businessName
        } = data;

        const html = this.templates.reservationConfirmation({
            customerName,
            service,
            location,
            date,
            bookingId,
            amount,
            paymentStatus,
            perks,
            corporateBenefits,
            businessName,
            supportEmail: 'support@driftiapp.com',
            website: 'www.driftiapp.com'
        });

        await this.transporter.sendMail({
            from: 'reservation@driftiapp.com',
            to: data.customerEmail,
            subject: 'Your Reservation is Confirmed! 🚀✨',
            html
        });

        // Send notification to business owner
        await this.transporter.sendMail({
            from: 'reservation@driftiapp.com',
            to: data.businessEmail,
            subject: 'New Reservation Received! 🎉',
            html: this.templates.reservationConfirmation({
                customerName,
                service,
                date,
                bookingId,
                amount,
                paymentStatus,
                businessName,
                isBusinessOwner: true
            })
        });
    }

    async sendPaymentConfirmation(data) {
        const {
            businessName,
            service,
            transactionId,
            amount,
            paymentStatus
        } = data;

        const html = this.templates.paymentReceived({
            businessName,
            service,
            transactionId,
            amount,
            paymentStatus,
            supportEmail: 'support@driftiapp.com',
            website: 'www.driftiapp.com'
        });

        await this.transporter.sendMail({
            from: 'payment@driftiapp.com',
            to: data.businessEmail,
            subject: 'Payment Received! 💸🚀',
            html
        });
    }

    async sendVerificationEmail(email, code) {
        await this.sendEmail(email, 'verification', code);
    }

    async sendPasswordResetEmail(email, resetLink) {
        await this.sendEmail(email, 'passwordReset', resetLink);
    }

    async sendBusinessNotification(data) {
        const {
            businessEmail,
            businessName,
            serviceType,
            bookingId,
            customerName,
            date,
            amount
        } = data;

        const emailContent = EmailNotification.generateBusinessNotification({
            businessName,
            serviceType,
            bookingId,
            customerName,
            date,
            amount
        });

        await this.transporter.sendMail({
            from: 'notifications@driftiapp.com',
            to: businessEmail,
            subject: `New Booking: ${serviceType} - ${customerName}`,
            html: emailContent
        });
    }

    async sendSupportEmail(data) {
        const {
            recipientEmail,
            recipientName,
            subject,
            message,
            ticketId
        } = data;

        const emailContent = EmailNotification.generateSupportEmail({
            recipientName,
            message,
            ticketId
        });

        await this.transporter.sendMail({
            from: 'support@driftiapp.com',
            to: recipientEmail,
            subject: `Support Ticket #${ticketId}: ${subject}`,
            html: emailContent
        });
    }

    async sendEmail(to, template, data) {
        try {
            const { subject, html } = this.templates[template](data);
            
            const mailOptions = {
                from: `"DriftiX" <${process.env.SMTP_FROM}>`,
                to,
                subject,
                html
            };

            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            trackError(error, { service: 'emailService', template });
            throw error;
        }
    }
}

module.exports = new EmailService(); 