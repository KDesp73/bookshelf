import "server-only";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

const CONNECT_OPTIONS = {
  bufferCommands: false,
  // Fail fast on Vercel/serverless instead of hanging until the function times out.
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 5_000,
  socketTimeoutMS: 10_000,
  maxPoolSize: 10,
  // Atlas + Vercel: IPv6 resolution can hang; prefer IPv4.
  family: 4 as const,
};

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (cached.conn?.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, CONNECT_OPTIONS).then((conn) => {
      cached.conn = conn;
      return conn;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
