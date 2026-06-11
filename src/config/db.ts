import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/compatibility_calculator';
  
  const options = {
    maxPoolSize: 50,
    socketTimeoutMS: 45000,
    autoIndex: process.env.NODE_ENV !== 'production', // Build indexes automatically in dev
  };

  while (true) {
    try {
      const conn = await mongoose.connect(connUri, options);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      break;
    } catch (error) {
      console.error(`MongoDB Connection Error 💥: ${(error as Error).message}`);
      console.log('Retrying connection to MongoDB in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
