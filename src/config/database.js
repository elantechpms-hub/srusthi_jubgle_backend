
// const mongoose = require('mongoose');
// const logger = require('../utils/logger');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI);
  

//     logger.info(`MongoDB Connected: ${conn.connection.host}`);

   
//     mongoose.connection.on('disconnected', () => {
//       logger.warn('MongoDB disconnected');
//     });

//     mongoose.connection.on('reconnected', () => {
//       logger.info('MongoDB reconnected');
//     });

//     mongoose.connection.on('error', (err) => {
//       logger.error(`MongoDB connection error: ${err.message}`);
//     });

//   } catch (error) {
//     logger.error(`Failed to connect to MongoDB: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;


// src/config/database.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, 
    });
  }

  try {
    cached.conn = await cached.promise;
    logger.info(`MongoDB Connected: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
