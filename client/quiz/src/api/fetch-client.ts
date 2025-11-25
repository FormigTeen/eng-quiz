import { HttpClient } from './http-client.interface';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Fetch implementation of HttpClient
 * Uses the native fetch API to make HTTP requests
 */
export class FetchHttpClient implements HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle response and throw error if not ok
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  /**
   * Perform a GET request
   */
  async get<T>(path: string, token?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(token),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Perform a POST request
   */
  async post<T>(path: string, body: any, token?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Perform a PUT request
   */
  async put<T>(path: string, body: any, token?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(path: string, token?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.buildHeaders(token),
    });

    return this.handleResponse<T>(response);
  }
}

