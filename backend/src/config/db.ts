import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
export let isUsingMongoDB = false;

// Local JSON file database fallback configuration
const LOCAL_DB_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, 'projects.json');

export async function connectDB(): Promise<void> {
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not provided. Falling back to local file-based database (JSON).');
    ensureLocalDbExists();
    return;
  }

  try {
    // Set a short timeout so it fails fast if MongoDB is not running locally
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isUsingMongoDB = true;
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', (error as Error).message);
    console.warn('⚠️ Falling back to local file-based database (JSON).');
    ensureLocalDbExists();
  }
}

function ensureLocalDbExists() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  console.log(`📂 Local JSON database initialized at: ${LOCAL_DB_FILE}`);
}

// Helpers for reading/writing local JSON data
export function readLocalProjects(): any[] {
  try {
    ensureLocalDbExists();
    const data = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local JSON database:', error);
    return [];
  }
}

export function writeLocalProjects(projects: any[]): void {
  try {
    ensureLocalDbExists();
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to local JSON database:', error);
  }
}
