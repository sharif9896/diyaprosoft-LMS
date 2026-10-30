import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverDir, '.env'), quiet: true });
export function config(env=process.env) {
  const secret = env.JWT_SECRET || '';
  if (secret.length < 32 || secret.startsWith('replace-this')) throw new Error('Set JWT_SECRET to a random value of at least 32 characters in server/.env.');
  const origins=(env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
  if(env.RENDER_EXTERNAL_URL)origins.push(env.RENDER_EXTERNAL_URL);
  const allowedOrigins=[...new Set(origins.map(value=>{
    let url;
    try {url=new URL(value.trim());} catch {throw new Error('CLIENT_ORIGIN must contain complete http:// or https:// website URLs, separated by commas.');}
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('CLIENT_ORIGIN must contain http:// or https:// website URLs without credentials.');
    return url.origin;
  }))];
  const cookieSameSite=(env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if(!['lax','strict','none'].includes(cookieSameSite))throw new Error('COOKIE_SAME_SITE must be lax, strict, or none.');
  const proxyHops=env.TRUST_PROXY || (env.RENDER==='true'?'1':'0');
  if(!/^\d+$/.test(proxyHops))throw new Error('TRUST_PROXY must be a non-negative number of trusted proxy hops.');
  return {
    secret,
    mongoUri:env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diyapro_lms',
    port:Number(env.PORT || 5000),
    host:env.HOST || '0.0.0.0',
    production:env.NODE_ENV==='production',
    origins:allowedOrigins,
    cookieSameSite,
    trustProxy:Number(proxyHops),
    serveClient:env.SERVE_CLIENT?env.SERVE_CLIENT!=='false':env.RENDER!=='true'
  };
}
