import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.db_connection;
const dbName = process.env.DB_NAME || "my_auth_flow";

if (!uri) {
  throw new Error("connection is missing !!");
}

const client = new MongoClient(uri);
let dbInstance = null;

export const connectDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  await client.connect();
  dbInstance = client.db(dbName);

  console.log(`MongoDB connected successfully to "${dbName}"`);

  return dbInstance;
};

export const getDB = () => {
  if (!dbInstance) {
    throw new Error("Database is not connected yet. Call connectDB() first.");
  }

  return dbInstance;
};

export const getCollection = (collectionName) => {
  return getDB().collection(collectionName);
};
