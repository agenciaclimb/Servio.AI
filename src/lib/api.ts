/**
 * Cliente HTTP para comunicação com o Backend REST API (servio-backend)
 * Centraliza autenticação, tratamento de erros e retry logic.
 */

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

interface ApiError {
  message: string;
  status: number;
}

class HttpClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const url = `${this.baseURL}${path}`;

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw { message: errorData.error || errorData.message, status: response.status } as ApiError;
      }

      return response.json() as Promise<T>;
    } catch (error: any) {
      if (retries > 0 && (!error.status || error.status >= 500)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.request<T>(path, options, retries - 1);
      }
      throw error;
    }
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  async put<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  }
}

// Singleton instance for the main backend
export const api = new HttpClient(API_URL);
export type { ApiError };