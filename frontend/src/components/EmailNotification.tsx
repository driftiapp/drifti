import React from 'react';
import { motion } from 'framer-motion';

interface EmailNotificationProps {
    type: 'reservation' | 'payment';
    recipientName: string;
    serviceType: 'Hotel Stay' | 'Car Rental' | 'Event' | 'Concert' | 'Cruise' | 'Vacation Package';
    businessName: string;
    businessAddress?: string;
    date: string;
    bookingId: string;
    amount: number;
    paymentStatus: 'Paid' | 'Pending';
    perks?: string[];
    isCorporateAccount?: boolean;
    corporateBenefits?: {
        bulkBookingDiscounts: boolean;
        flexiblePayment: boolean;
        dedicatedManager: boolean;
    };
}

const EmailNotification: React.FC<EmailNotificationProps> = ({
    type,
    recipientName,
    serviceType,
    businessName,
    businessAddress,
    date,
    bookingId,
    amount,
    paymentStatus,
    perks,
    isCorporateAccount,
    corporateBenefits
}) => {
    const getServicePerks = () => {
        const defaultPerks = {
            'Hotel Stay': ['Early check-in', 'Spa discounts', 'Priority upgrades'],
            'Car Rental': ['Free GPS upgrade', 'Extra mileage', 'VIP pickup'],
            'Event': ['Express entry', 'Backstage access', 'VIP seating'],
            'Concert': ['Express entry', 'Backstage access', 'VIP seating'],
            'Cruise': ['Priority boarding', 'All-inclusive deals', 'Special excursions'],
            'Vacation Package': ['Priority boarding', 'All-inclusive deals', 'Special excursions']
        };

        return perks || defaultPerks[serviceType] || [];
    };

    const renderReservationEmail = () => (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Your Reservation is Confirmed! 🚀✨</h1>
            <p className="mb-4">Dear {recipientName},</p>
            <p className="mb-6">Thank you for booking with Drifti! Your reservation is confirmed.</p>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">📍 Reservation Details:</h2>
                <ul className="space-y-2">
                    <li>Service: {serviceType}</li>
                    <li>Location: {businessName}{businessAddress ? ` - ${businessAddress}` : ''}</li>
                    <li>Date: {date}</li>
                    <li>Booking Reference: #{bookingId}</li>
                    <li>Total Amount: ${amount}</li>
                    <li>Payment Status: {paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Pending'}</li>
                </ul>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">🎁 Exclusive Perks Just for You!</h2>
                <ul className="list-disc pl-5 space-y-1">
                    {getServicePerks().map((perk, index) => (
                        <li key={index}>{perk}</li>
                    ))}
                </ul>
            </div>

            {isCorporateAccount && corporateBenefits && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">📊 Corporate Account Benefits</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        {corporateBenefits.bulkBookingDiscounts && <li>Bulk Booking Discounts</li>}
                        {corporateBenefits.flexiblePayment && <li>Flexible Payment Options</li>}
                        {corporateBenefits.dedicatedManager && <li>Dedicated Account Manager</li>}
                    </ul>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">📞 Need Help?</h2>
                <p>Contact us at:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>General Inquiries: info@driftiapp.com</li>
                    <li>Reservations: reservation@driftiapp.com</li>
                    <li>Support: support@driftiapp.com</li>
                </ul>
            </div>
        </div>
    );

    const renderPaymentEmail = () => (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Payment Received! 💸🚀</h1>
            <p className="mb-4">Dear {recipientName},</p>
            <p className="mb-6">Great news! You have received a payment from Drifti.</p>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">💳 Payment Details:</h2>
                <ul className="space-y-2">
                    <li>Service: {serviceType}</li>
                    <li>Business: {businessName}</li>
                    <li>Transaction ID: #{bookingId}</li>
                    <li>Amount: ${amount}</li>
                    <li>Status: ✅ Successful</li>
                </ul>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">💰 Smart Financial Insights</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Track daily, weekly, and monthly earnings</li>
                    <li>Get insights on customer trends</li>
                    <li>Monitor refunds and transactions</li>
                </ul>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">📞 Need Help?</h2>
                <p>Contact us at:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Payments & Billing: payment@driftiapp.com</li>
                    <li>Business Support: support@driftiapp.com</li>
                </ul>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {type === 'reservation' ? renderReservationEmail() : renderPaymentEmail()}
        </motion.div>
    );
};

export default EmailNotification; 