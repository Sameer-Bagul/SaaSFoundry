import mongoose from 'mongoose';

if (!process.env.MONGODB_URL) {
  throw new Error(
    "MONGODB_URL must be set. Did you forget to provision a database?",
  );
}

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL!);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const db = mongoose.connection;
