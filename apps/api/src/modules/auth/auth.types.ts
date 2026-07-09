export interface AdminLoginDTO {
  username: string;
  password: string;
}

export interface AdminSessionDTO {
  token: string;
  expiresAt: string;
  username: string;
}
