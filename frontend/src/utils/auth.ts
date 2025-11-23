class AuthService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
  }

  async refreshAccessToken(): Promise<string> {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      this.setAccessToken(data.access_token);
      return data.access_token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
}

export const authService = new AuthService();