import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/unauthorized-error.js';
import { verifyAdminToken } from '../utils/admin-token.js';

export function requireAdminAuth(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing admin token');
  }

  const token = authorization.slice('Bearer '.length);
  const payload = verifyAdminToken(token);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired admin token');
  }

  request.headers['x-admin-user'] = payload.username;
  next();
}
