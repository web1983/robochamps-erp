import { MongoClient } from 'mongodb';

// Lazy initialization - only connect when actually needed
// Export a function that returns the promise, not the promise itself
// This prevents the promise from being created at module load time
let _clientPromise: Promise<MongoClient> | null = null;
let _client: MongoClient | null = null;

function getClientPromise(): Promise<MongoClient> {
  // If already connected, return existing promise
  if (_clientPromise) {
    return _clientPromise;
  }

  // Check for MongoDB URI
  if (!process.env.MONGODB_URI) {
    // During build time, return a rejected promise that won't crash the build
    // The actual error will be caught at runtime
    return Promise.reject(new Error('MONGODB_URI is not set. Please add it to your environment variables.'));
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

  // Create connection promise
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      _client = new MongoClient(uri, mongoOptions);
      globalWithMongo._mongoClientPromise = _client.connect().catch((error) => {
        console.error('MongoDB connection error:', error);
        // Clear the promise so it can be retried
        delete globalWithMongo._mongoClientPromise;
        _clientPromise = null;
        _client = null;
        throw error;
      });
    }
    _clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    _client = new MongoClient(uri, mongoOptions);
    _clientPromise = _client.connect().catch((error) => {
      console.error('MongoDB connection error:', error);
      _clientPromise = null;
      _client = null;
      throw error;
    });
  }

  return _clientPromise;
}

export default getClientPromise;
