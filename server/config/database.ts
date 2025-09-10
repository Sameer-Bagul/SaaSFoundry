import mongoose from 'mongoose';

const connectDB = async (mongoUrl?: string, options: { retries?: number; delay?: number; timeoutMS?: number } = {}) => {
  const { retries = 5, delay = 2000, timeoutMS = 5000 } = options;
  const connectionString = mongoUrl || process.env.MONGODB_URL;
  
  // Don't try to connect to localhost in Replit environment
  const isReplit = !!(process.env.REPL_ID || process.env.REPL_SLUG);
  if (isReplit && !connectionString) {
    console.warn('⚠️  Running in Replit without MONGODB_URL. Please set MONGODB_URL environment variable to a cloud MongoDB URI (e.g., MongoDB Atlas)');
    return false;
  }
  
  const finalConnectionString = connectionString || 'mongodb://localhost:27017/ai-saas';
  
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(finalConnectionString, { 
        serverSelectionTimeoutMS: timeoutMS 
      });
      
      console.log(`✅ MongoDB connected successfully to: ${finalConnectionString.split('@')[1] || 'localhost'}`);
      return true;
    } catch (error: any) {
      const attempt = i + 1;
      console.error(`❌ MongoDB connection failed (attempt ${attempt}/${retries}):`, error?.message);
      
      if (attempt === retries) {
        console.error('💥 All MongoDB connection attempts failed. Server will start without database.');
        return false;
      }
      
      const backoffDelay = delay * Math.pow(2, i);
      console.log(`⏳ Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  return false;
};

export default connectDB;