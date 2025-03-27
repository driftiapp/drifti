const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle Firebase Auth errors
  if (err.code === 'auth/invalid-token') {
    return res.status(401).json({
      error: 'Invalid authentication token',
      message: err.message
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Key Error',
      message: 'A record with this key already exists'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
};

module.exports = { errorHandler }; 