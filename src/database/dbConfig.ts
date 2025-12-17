import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> => {
      try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined');
        }
        console.log('Connecting to MongoDB...');
        return await mongoose.connect(uri);
      } catch (error) {
        console.error('Database connection error:', error);
        throw error;
      }
    },
  },
];