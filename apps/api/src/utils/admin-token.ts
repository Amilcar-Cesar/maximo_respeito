import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

interface AdminTokenPayload {
  sub: string;
  username: string;
  role: 'admin';
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return createHmac('sha256', env.ADMIN_TOKEN_SECRET).update(value).digest('base64url');
}

export function createAdminToken(username: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: AdminTokenPayload = {
    sub: username,
    username,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminTokenPayload;

  if (payload.role !== 'admin' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
