import { type LoginData, type RegisterData, type AuthResponse, type RegisterRequest, type UserResponse, type User } from '../types/auth';
import type { DialogResponse, MessageResponse } from '../types/dialog';
import { authService } from '../utils/auth';

const API_BASE_URL = import.meta.env.BACKEND_API || 'http://localhost:8000/api/v1';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const token = authService.getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers, credentials: 'include' });
      
      if (response.status === 401) {
        const newToken = await authService.refreshAccessToken();
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: { ...headers, 'Authorization': `Bearer ${newToken}` },
          credentials: 'include'
        });
        
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        
        return await retryResponse.json();
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    if (response.access_token) {
      authService.setAccessToken(response.access_token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    // await this.request('/auth/logout', {
    //   method: 'POST',
    // });

    authService.clearTokens();
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me');
  } 

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });

    if (response.access_token) {
      authService.setAccessToken(response.access_token);
    }
    
    return response;
  }

  async createDialog(userId: number): Promise<{ dialog_id: number; existing: boolean }> {
    return this.request<{ dialog_id: number; existing: boolean }>('/dialogs', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getMyDialogs(): Promise<DialogResponse[]> {
    return this.request<DialogResponse[]>('/dialogs');
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/users/search?username=${encodeURIComponent(query)}`);
  }

  async createChat(userId: number): Promise<{ chat_id: number; existing: boolean }> {
    return this.request<{ chat_id: number; existing: boolean }>('/chats', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getDialogMessages(dialogId: number): Promise<MessageResponse[]> {
    return this.request<MessageResponse[]>(`/dialogs/${dialogId}/messages`);
  }
}

export const apiService = new ApiService();