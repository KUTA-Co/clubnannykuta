import mongoose from 'mongoose';

let connectionPromise = null;
let listenersAttached = false;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set — database-backed routes will be unavailable until MongoDB is configured.');
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      // Fail fast on a stale/idle socket instead of buffering queries forever
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 10,
    });

    const conn = await connectionPromise;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    if (!listenersAttached) {
      listenersAttached = true;

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        connectionPromise = null;
      });

      // Graceful shutdown
      process.once('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      });
    }

    return conn;
  } catch (error) {
    connectionPromise = null;
    console.error('Error connecting to MongoDB:', error.message);
    if (process.env.VERCEL === '1') {
      return null;
    }
    process.exit(1);
  }
};

export default connectDB;
