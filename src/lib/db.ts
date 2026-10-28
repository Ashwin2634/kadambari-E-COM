import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = g._mongoose ?? (g._mongoose = { conn: null, promise: null });

/** Cached connection with pooling – safe for serverless (Vercel) and dev HMR. */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000, bufferCommands: false });
  cache.conn = await cache.promise;
  return cache.conn;
}
