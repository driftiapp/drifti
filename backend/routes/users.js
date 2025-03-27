const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { auth, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const { trackError } = require('../monitoring/errorMonitor');
const { NotFoundError, ValidationError, AuthenticationError } = require('../utils/errors');
const { validateUserUpdate, validateUserRegistration } = require('../middleware/validation');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { generateVerificationCode } = require('../utils/helpers');

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, name, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });

    if (existingUser) {
      throw new ValidationError('User with this email or phone number already exists');
    }

    // Create Firebase user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Create user in database
    const user = new User({
      firebaseUid: userRecord.uid,
      email,
      password,
      name,
      phoneNumber,
      verificationCode: generateVerificationCode()
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(email, user.verificationCode);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      userId: user._id
    });
  } catch (error) {
    trackError(error, { route: 'POST /api/users/register' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Verify user email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.verificationCode !== verificationCode) {
      throw new ValidationError('Invalid verification code');
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    trackError(error, { route: 'POST /api/users/verify-email' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const resetToken = await admin.auth().generatePasswordResetLink(email);
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    trackError(error, { route: 'POST /api/users/forgot-password' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get all users (admin only)
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password -verificationCode -resetPasswordToken -resetPasswordExpires')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/users' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:uid', auth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.uid })
      .select('-password -verificationCode -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json(user);
  } catch (error) {
    trackError(error, { route: 'GET /api/users/:uid' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Update user
router.put('/:uid', auth, validateUserUpdate, async (req, res) => {
  try {
    const { displayName, phoneNumber, preferences, location } = req.body;
    const user = await User.findOne({ firebaseUid: req.params.uid });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has permission to update
    if (req.user.role !== 'admin' && req.user.firebaseUid !== req.params.uid) {
      throw new AuthenticationError('Not authorized to update this user');
    }

    // Update Firebase user if needed
    if (displayName) {
      await admin.auth().updateUser(req.params.uid, { displayName });
    }

    // Update user in database
    if (displayName) user.name = displayName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (location) user.location = location;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        ...user.toObject(),
        password: undefined,
        verificationCode: undefined,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      }
    });
  } catch (error) {
    trackError(error, { route: 'PUT /api/users/:uid' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Delete user
router.delete('/:uid', auth, checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.uid });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete from Firebase
    await admin.auth().deleteUser(req.params.uid);

    // Delete from database
    await user.remove();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    trackError(error, { route: 'DELETE /api/users/:uid' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verificationCode -resetPasswordToken -resetPasswordExpires')
      .populate('wallet.transactions');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json(user);
  } catch (error) {
    trackError(error, { route: 'GET /api/users/me' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Update user profile
router.put('/me', auth, validateUserUpdate, async (req, res) => {
  try {
    const { name, phoneNumber, preferences, location } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (location) user.location = location;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...user.toObject(),
        password: undefined,
        verificationCode: undefined,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      }
    });
  } catch (error) {
    trackError(error, { route: 'PUT /api/users/me' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Update user location
router.put('/me/location', auth, async (req, res) => {
  try {
    const { coordinates } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.location.coordinates = coordinates;
    await user.save();

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    trackError(error, { route: 'PUT /api/users/me/location' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router; 