import { FetchHttpClient } from './fetch-client';
import { HttpClient } from './http-client.interface';

// Create a singleton instance of the HTTP client
const httpClient: HttpClient = new FetchHttpClient();

/**
 * Perform a POST request
 * @deprecated Use httpClient.post() directly instead
 */
export async function apiPost<T>(path: string, body: any, token?: string): Promise<T> {
  return httpClient.post<T>(path, body, token);
}

export type LoginResponse = { token: string };

/**
 * Perform a GET request
 * @deprecated Use httpClient.get() directly instead
 */
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return httpClient.get<T>(path, token);
}

// Export the HTTP client instance for direct use
export { httpClient };
export type { HttpClient };
