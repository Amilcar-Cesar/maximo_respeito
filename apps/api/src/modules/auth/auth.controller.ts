import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  login = async (request: Request, response: Response) => {
    const payload = loginSchema.parse(request.body);
    const session = await this.authService.login(payload);
    response.json({ data: session });
  };
}
