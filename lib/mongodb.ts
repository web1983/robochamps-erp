import { MongoClient } from 'mongodb';

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

function getMongoClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local or environment variables');
  }

  const uri: string = process.env.MONGODB_URI.trim();
  
  // MongoDB connection options
  const mongoOptions = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
  };

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, mongoOptions);
      globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
        console.error('MongoDB connection error:', error);
        // Clear the promise so it can be retried
        delete globalWithMongo._mongoClientPromise;
        throw error;
      });
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    if (!clientPromise) {
      client = new MongoClient(uri, mongoOptions);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

// Lazy initialization - only connect when actually needed
const lazyClientPromise = (): Promise<MongoClient> => {
  if (!clientPromise) {
    clientPromise = getMongoClient();
  }
  return clientPromise;
};

export default lazyClientPromise;
