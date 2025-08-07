export interface AuthResponse {
  message: string;
  token?: string;
  username?: string;
  email?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthState {
  token: string | null;
  username: string | null;
  email: string | null;
}
