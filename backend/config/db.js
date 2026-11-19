import mongoose from 'mongoose';

let cachedConnection = null;

export const connectDB = async () => {
  // Return existing connection if ready
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGODB_URl;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI / MONGODB_URL is not defined in environment variables.');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      bufferCommands: false, // Disable Mongoose buffering for serverless
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = conn;
    console.log('✅ MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

export default connectDB;
