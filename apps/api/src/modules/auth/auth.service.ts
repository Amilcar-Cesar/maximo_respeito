import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { createAdminToken } from '../../utils/admin-token.js';
import type { AdminLoginDTO, AdminSessionDTO } from './auth.types.js';

export class AuthService {
  login(input: AdminLoginDTO): AdminSessionDTO {
    const usernameMatch = input.username === env.ADMIN_USERNAME;
    const passwordMatch = input.password === env.ADMIN_PASSWORD;

    if (!usernameMatch || !passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = createAdminToken(input.username);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();

    return {
      token,
      expiresAt,
      username: input.username
    };
  }
}
