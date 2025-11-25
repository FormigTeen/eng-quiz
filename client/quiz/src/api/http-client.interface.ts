/**
 * HTTP Client Interface
 * Define a contract for HTTP client implementations
 */
export interface HttpClient {
  /**
   * Perform a GET request
   * @param path - API endpoint path
   * @param token - Optional authentication token
   * @returns Promise with the response data
   */
  get<T>(path: string, token?: string): Promise<T>;

  /**
   * Perform a POST request
   * @param path - API endpoint path
   * @param body - Request body data
   * @param token - Optional authentication token
   * @returns Promise with the response data
   */
  post<T>(path: string, body: any, token?: string): Promise<T>;

  /**
   * Perform a PUT request
   * @param path - API endpoint path
   * @param body - Request body data
   * @param token - Optional authentication token
   * @returns Promise with the response data
   */
  put<T>(path: string, body: any, token?: string): Promise<T>;

  /**
   * Perform a DELETE request
   * @param path - API endpoint path
   * @param token - Optional authentication token
   * @returns Promise with the response data
   */
  delete<T>(path: string, token?: string): Promise<T>;
}

