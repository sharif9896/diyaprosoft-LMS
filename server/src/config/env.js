import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverDir, '.env'), quiet: true });
export function config() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || secret.startsWith('replace-this')) throw new Error('Set JWT_SECRET to a random value of at least 32 characters in server/.env.');
  return { secret, mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diyapro_lms', port: Number(process.env.PORT || 5000), production: process.env.NODE_ENV === 'production', origins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(x=>x.trim()) };
}
