/**
 * @file db.js — Database Configuration
 *
 * Responsible for establishing and managing the MongoDB connection used by
 * the entire UniPulse backend. This module exports a single async function
 * that is invoked once at server startup (in server.js).
 *
 * Environment variables required:
 *   MONGO_URI  – Full MongoDB connection string (e.g. mongodb+srv://...)
 *               Typically defined in .env at the project root.
 *
 * Behaviour:
 *   - On success: logs the connected host and returns control to the caller.
 *   - On failure: logs the error and terminates the process (exit code 1),
 *     since the API cannot operate without a database.
 */

import mongoose from 'mongoose';

/**
 * Establishes the single, shared MongoDB connection for the whole app.
 *
 * We call this once on boot (from server.js). Mongoose keeps an internal
 * connection pool, so every model import reuses this same connection.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in your environment (.env)');
    }

    const conn = await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // A DB failure means the API cannot function, so we log and exit hard.
    console.error(`[db] Connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
