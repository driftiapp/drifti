const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Test Firebase connection
router.get('/firebase-test', async (req, res) => {
    try {
        // Check if Firebase is initialized
        if (!admin.apps.length) {
            return res.status(500).json({
                success: false,
                error: 'Firebase Admin not initialized'
            });
        }

        // Try to get a list of users (limited to 1 to avoid performance issues)
        const listUsersResult = await admin.auth().listUsers(1);
        
        res.json({
            success: true,
            message: 'Firebase connection successful',
            details: {
                projectId: admin.app().options.projectId,
                serviceAccountEmail: admin.app().options.credential.clientEmail,
                userCount: listUsersResult.users.length
            }
        });
    } catch (error) {
        console.error('Firebase test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: {
                code: error.code,
                stack: error.stack
            }
        });
    }
});

// Test Firebase authentication
router.post('/firebase-auth-test', async (req, res) => {
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return res.status(400).json({
                success: false,
                error: 'ID token is required'
            });
        }

        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        res.json({
            success: true,
            message: 'Firebase authentication successful',
            details: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified
            }
        });
    } catch (error) {
        console.error('Firebase auth test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: {
                code: error.code,
                stack: error.stack
            }
        });
    }
});

module.exports = router; 