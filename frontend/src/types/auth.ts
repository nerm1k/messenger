export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
    is_online: boolean;
  };
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  is_online: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  is_online: boolean;
  created_at: string;
}

export interface ProfileData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}