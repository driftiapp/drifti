const mongoose = require('mongoose');
const crypto = require('crypto');

// Decode MongoDB URI with proper handling of special characters
const decodeMongoURI = (uri) => {
  try {
    // First decode the entire URI
    let decodedUri = decodeURIComponent(uri);
    
    // Extract the password part
    const passwordMatch = decodedUri.match(/\/\/[^:]+:([^@]+)@/);
    if (passwordMatch) {
      const encodedPassword = passwordMatch[1];
      const decodedPassword = decodeURIComponent(encodedPassword);
      decodedUri = decodedUri.replace(encodedPassword, decodedPassword);
    }
    
    return decodedUri;
  } catch (error) {
    console.error('Error decoding MongoDB URI:', error);
    throw new Error('Invalid MongoDB URI format');
  }
};

// Get MongoDB connection string based on environment
const getMongoURI = () => {
  const env = process.env.NODE_ENV || 'development';
  
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  // Decode the URI
  uri = decodeMongoURI(uri);
  
  // Add environment-specific options
  const options = {
    retryWrites: true,
    w: 'majority',
    appName: `driftix-${env}`,
  };
  
  // Add SSL for production
  if (env === 'production') {
    options.ssl = true;
    options.sslValidate = true;
  }
  
  // Add the options to the URI
  const uriWithOptions = new URL(uri);
  Object.entries(options).forEach(([key, value]) => {
    uriWithOptions.searchParams.set(key, value);
  });
  
  return uriWithOptions.toString();
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(getMongoURI(), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Set up error handling for the connection
        mongoose.connection.on('error', err => {
            console.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB; 