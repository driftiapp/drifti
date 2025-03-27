const admin = require('firebase-admin');
const User = require('../models/User');
const { trackError } = require('../monitoring/errorMonitor');

// Verify Firebase ID token
const auth = async (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Find or create the user in our database
        let user = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!user) {
            // Create new user if they don't exist
            user = new User({
                firebaseUid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name || decodedToken.email.split('@')[0],
                photoURL: decodedToken.picture
            });
            await user.save();
        }

        // Attach the user to the request object
        req.user = user;
        next();
    } catch (error) {
        trackError(error, { route: req.path, method: req.method });
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to check if user has required role
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

// Verify business ownership
const verifyBusinessOwnership = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'business') {
            return res.status(403).json({ message: 'Business account required' });
        }

        const businessId = req.params.businessId || req.body.businessId;
        if (!businessId) {
            return res.status(400).json({ message: 'Business ID required' });
        }

        if (businessId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this business' });
        }

        next();
    } catch (error) {
        trackError(error, { route: req.path, method: req.method });
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    auth,
    checkRole,
    verifyBusinessOwnership
}; 