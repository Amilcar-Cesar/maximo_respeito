import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { z } from 'zod';

const isNetlifyRuntime = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (!isNetlifyRuntime) {
  let currentDir = process.cwd();
  let envPath = path.join(currentDir, '.env');
  
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(envPath)) {
      break;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
    envPath = path.join(currentDir, '.env');
  }
  
  dotenv.config({ path: envPath });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('admin123'),
  ADMIN_TOKEN_SECRET: z.string().min(16).default('maximo-respeito-admin-secret')
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv
};
