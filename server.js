// require('dotenv').config();

// const app = require('./src/app');
// const connectDB = require('./src/config/database');
// const logger = require('./src/utils/logger');
// const { verifyEmailConfig } = require('./src/config/email');

// const PORT = process.env.PORT || 5000;

// // Graceful shutdown handlers
// const gracefulShutdown = (signal) => {
//   logger.info(`${signal} received: closing HTTP server and database connection`);
//   server.close(() => {
//     logger.info('HTTP server closed');
//     // Close MongoDB connection
//     require('mongoose').connection.close(() => {
//       logger.info('MongoDB connection closed');
//       process.exit(0);
//     });
//   });
// };

// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// // Start server
// const startServer = async () => {
//   try {
//     // Connect to MongoDB
//     await connectDB();
//     const User = require('./src/models/User');
//     const userCount = await User.countDocuments({});
    
//     if (userCount === 0) {
//       try {
//         const superAdmin = new User({
//           name: 'Super Admin',
//           email: 'admin@corepench.com',
//           role: 'admin',
//           isActive: true,
//         });
//         await superAdmin.save();
        
//         logger.info('Super Admin user created automatically: admin@corepench.com');
//       } catch (err) {
//         logger.error('Failed to create super admin:', err.message);
//       }
//     } else {
//       logger.info(`Users already exist (${userCount}). Skipping super admin creation.`);
//     }

//     // Verify email configuration (optional, non-blocking)
//     verifyEmailConfig();

//     // Start Express server
//     const server = app.listen(PORT, () => {
//       logger.info(`Server is running on port ${PORT}`);
//       logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
//       logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
//       logger.info(`Health Check: http://localhost:${PORT}/health`);
//     });

//     // Handle unhandled promise rejections
//     process.on('unhandledRejection', (err) => {
//       logger.error('Unhandled Promise Rejection:', err);
//       // Close server & exit process
//       server.close(() => {
//         process.exit(1);
//       });
//     });

//     // Handle uncaught exceptions
//     process.on('uncaughtException', (err) => {
//       logger.error('Uncaught Exception:', err);
//       process.exit(1);
//     });

//   } catch (error) {
//     logger.error('Failed to start server:', error.message);
//     process.exit(1);
//   }
// };

// // Run the server
// startServer();


// require('dotenv').config();

// const app = require('./src/app');
// const connectDB = require('./src/config/database');
// const logger = require('./src/utils/logger');
// const { verifyEmailConfig } = require('./src/config/email');

// const PORT = process.env.PORT || 5000;

// // Declare server at the outer scope (will be assigned later)
// let server;  // ← Important!

// // Graceful shutdown handler
// const gracefulShutdown = (signal) => {
//   logger.info(`${signal} received: closing HTTP server and database connection`);

//   if (server) {
//     server.close(() => {
//       logger.info('HTTP server closed');

//       // Close MongoDB connection
//       const mongoose = require('mongoose');
//       mongoose.connection.close(() => {
//         logger.info('MongoDB connection closed');
//         process.exit(0);
//       });
//     });
//   } else {
//     logger.warn('No active server instance to close');
//     process.exit(0);
//   }

//   // Safety timeout - force exit if cleanup takes too long
//   setTimeout(() => {
//     logger.error('Could not close connections in time, forcing exit');
//     process.exit(1);
//   }, 10000);
// };

// // Register shutdown handlers **before** starting the server
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// // Start server
// const startServer = async () => {
//   try {
//     // 1. Connect to MongoDB
//     await connectDB();

//     // 2. Check/create super admin
//     const User = require('./src/models/User');
//     const userCount = await User.countDocuments({});

//     if (userCount === 0) {
//       try {
//         const superAdmin = new User({
//           name: 'Super Admin',
//           email: 'admin@corepench.com',
//           role: 'admin',
//           isActive: true,
//         });
//         await superAdmin.save();
//         logger.info('Super Admin user created automatically: admin@corepench.com');
//       } catch (err) {
//         logger.error('Failed to create super admin:', err.message);
//       }
//     } else {
//       logger.info(`Users already exist (${userCount}). Skipping super admin creation.`);
//     }

//     // 3. Verify email config (non-blocking)
//     verifyEmailConfig();

//     // 4. Start Express server and **assign** to the outer variable
//     server = app.listen(PORT, () => {
//       logger.info(`Server is running on port ${PORT}`);
//       logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
//       logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
//       logger.info(`Health Check: http://localhost:${PORT}/health`);
//     });

//     // 5. Handle unhandled rejections
//     process.on('unhandledRejection', (err) => {
//       logger.error('Unhandled Promise Rejection:', err);
//       if (server) server.close(() => process.exit(1));
//       else process.exit(1);
//     });

//     // 6. Handle uncaught exceptions
//     process.on('uncaughtException', (err) => {
//       logger.error('Uncaught Exception:', err);
//       process.exit(1);
//     });

//   } catch (error) {
//     logger.error('Failed to start server:', error.message);
//     process.exit(1);
//   }
// };

// // Run the server
// startServer();




require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { verifyEmailConfig } = require('./src/config/email');
const mongoose = require('mongoose');

// Use Render's assigned port (fallback only for local development)
const PORT = process.env.PORT || 5000;

// Declare server at module scope so it's accessible in shutdown
let server;

// Graceful shutdown handler (async version - no callbacks for Mongoose.close)
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received: closing HTTP server and database connection`);

  // Close Express server first
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  } else {
    logger.warn('No active server instance to close');
  }

  // Close MongoDB connection (await Promise - no callback!)
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed successfully');
  } catch (err) {
    logger.error('Error closing MongoDB connection:', err.message);
  }

  // Exit process cleanly
  process.exit(0);

  // Safety timeout - force exit if something hangs (10 seconds)
  setTimeout(() => {
    logger.error('Could not close connections in time, forcing exit');
    process.exit(1);
  }, 10000);
};

// Register shutdown handlers BEFORE starting the server
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server function
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Check/create super admin (only if zero users)
    const User = require('./src/models/User');
    const userCount = await User.countDocuments({});

    if (userCount === 0) {
      try {
        const superAdmin = new User({
          name: 'Super Admin',
          email: 'admin@corepench.com',
          role: 'admin',
          isActive: true,
        });
        await superAdmin.save();
        logger.info('Super Admin user created automatically: admin@corepench.com');
      } catch (err) {
        logger.error('Failed to create super admin:', err.message);
      }
    } else {
      logger.info(`Users already exist (${userCount}). Skipping super admin creation.`);
    }

    // 3. Verify email configuration (non-blocking)
    await verifyEmailConfig(); // Make it await if it's async

    // 4. Start Express server
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
    });

    // 5. Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', reason);
      gracefulShutdown('unhandledRejection'); // Graceful shutdown instead of abrupt exit
    });

    // 6. Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Run the server
startServer();
