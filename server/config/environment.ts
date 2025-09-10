import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/ai-saas',
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-here',
  
  // Razorpay configuration
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  
  // Other configuration
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;