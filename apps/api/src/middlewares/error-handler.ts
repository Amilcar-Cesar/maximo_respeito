import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details ?? null
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        message: 'Validation failed',
        details: error.flatten()
      }
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    error: {
      message: 'Internal server error',
      details: null
    }
  });
}
