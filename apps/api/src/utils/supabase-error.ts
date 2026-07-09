import type { PostgrestError } from '@supabase/supabase-js';
import { AppError } from '../errors/app-error.js';

export function throwOnError(error: PostgrestError | null, message?: string): void {
  if (error) {
    throw new AppError(message ?? error.message, 500, error);
  }
}

export function assertNoError<T>(
  result: { data: T; error: PostgrestError | null },
  message?: string
): NonNullable<T> {
  throwOnError(result.error, message);

  if (result.data === null || result.data === undefined) {
    throw new AppError(message ?? 'No data returned', 500);
  }

  return result.data;
}

export function toPriceString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === 'number' ? value.toFixed(2) : value;
}
