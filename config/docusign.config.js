require('dotenv').config();
const path = require('path');

module.exports = {
    // DocuSign API Configuration
    basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
    userId: process.env.DOCUSIGN_USER_ID,
    accountId: process.env.DOCUSIGN_ACCOUNT_ID,
    privateKeyPath: process.env.DOCUSIGN_PRIVATE_KEY_PATH || path.join(__dirname, '../keys/docusign.key'),
    
    // JWT Configuration
    scopes: [
        'signature',
        'impersonation'
    ],
    
    // Document Storage Configuration
    documentsPath: process.env.DOCUMENTS_PATH || path.join(__dirname, '../contracts'),
    
    // Webhook Configuration
    webhookUrl: process.env.WEBHOOK_URL || 'https://api.drifti.com/webhooks/docusign',
    
    // Contract Templates
    templates: {
        storeOwner: {
            templateId: process.env.STORE_OWNER_TEMPLATE_ID,
            requiredDocuments: ['BUSINESS_LICENSE', 'INSURANCE'],
            signingPositions: [
                { page: 1, x: 100, y: 100 },  // Owner signature
                { page: 2, x: 100, y: 100 },  // Terms acceptance
                { page: 3, x: 100, y: 100 }   // Payment terms
            ]
        },
        driver: {
            templateId: process.env.DRIVER_TEMPLATE_ID,
            requiredDocuments: ['DRIVERS_LICENSE', 'INSURANCE', 'VEHICLE_REGISTRATION'],
            signingPositions: [
                { page: 1, x: 100, y: 100 },  // Driver signature
                { page: 2, x: 100, y: 100 },  // Terms acceptance
                { page: 3, x: 100, y: 100 }   // Vehicle information
            ]
        }
    },
    
    // Security Settings
    security: {
        allowedFileTypes: ['.pdf', '.docx', '.jpg', '.png'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        encryptDocuments: true,
        retentionPeriod: 7 * 365, // 7 years in days
    },
    
    // Notification Settings
    notifications: {
        email: {
            enabled: true,
            templates: {
                contractSent: 'templates/email/contract_sent.html',
                contractSigned: 'templates/email/contract_signed.html',
                contractRejected: 'templates/email/contract_rejected.html',
                contractExpiring: 'templates/email/contract_expiring.html'
            }
        },
        slack: {
            enabled: true,
            channel: '#contract-alerts',
            mentions: ['@legal', '@operations']
        }
    },
    
    // Blockchain Integration
    blockchain: {
        network: process.env.NETWORK || 'mainnet',
        contractAddress: process.env.DRIFTI_CONTRACT_MANAGER_ADDRESS,
        gasLimit: 500000,
        confirmations: 2
    },
    
    // Compliance Settings
    compliance: {
        auditTrail: true,
        storageRegion: 'us-east-1',
        dataRetention: {
            signed: 7 * 365, // 7 years in days
            unsigned: 30,    // 30 days
            rejected: 90     // 90 days
        },
        requiredFields: {
            storeOwner: [
                'businessName',
                'ownerName',
                'taxId',
                'businessAddress',
                'phoneNumber',
                'email'
            ],
            driver: [
                'fullName',
                'driversLicense',
                'vehicleInfo',
                'insuranceNumber',
                'phoneNumber',
                'email'
            ]
        }
    }
}; 