import { supabase } from '../../config/supabase.js';
import { AppError } from '../../errors/app-error.js';
import { createAdminToken } from '../../utils/admin-token.js';
import type { AdminLoginDTO, AdminSessionDTO } from './auth.types.js';

export class AuthService {
  async login(input: AdminLoginDTO): Promise<AdminSessionDTO> {
    const { data, error } = await supabase.rpc('verify_admin_password', {
      p_username: input.username,
      p_password: input.password
    });

    if (error || !data || data.length === 0) {
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

