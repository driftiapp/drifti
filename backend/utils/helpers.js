const crypto = require('crypto');

// Generate a random verification code
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate a random token
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash a string
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Format phone number to E.164 format
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (!cleaned.startsWith('1')) {
    return `+1${cleaned}`;
  }
  
  return `+${cleaned}`;
};

// Format currency amount
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

// Generate a random string
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Format date to ISO string
const formatDate = (date) => {
  return new Date(date).toISOString();
};

// Parse date from ISO string
const parseDate = (isoString) => {
  return new Date(isoString);
};

// Check if date is valid
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

// Deep clone an object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined values from object
const removeUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
};

module.exports = {
  generateVerificationCode,
  generateToken,
  hashString,
  formatPhoneNumber,
  formatCurrency,
  calculateDistance,
  generateRandomString,
  formatDate,
  parseDate,
  isValidDate,
  deepClone,
  removeUndefined
}; 