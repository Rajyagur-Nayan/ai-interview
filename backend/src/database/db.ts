import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../models/schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export const pool = new Pool({
  connectionString,
  // If connection is SSL-based (like Neon), enforce config accordingly.
  ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
export default db;
