/**
 * Prompt History v2 API Client
 * Type-safe API calls with JWT authentication
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export interface PromptHistory {
  id: string;
  original_prompt: string;
  optimized_prompt?: string;
  intent_category: IntentCategory;
  source: Source;
  tags: string[];
  meta: Record<string, any>;
  model?: string;
  tokens?: number;
  credits_spent?: number;
  enhanced_at?: string;
  created_at: string;
  updated_at: string;
}

export type IntentCategory = 'summary' | 'creative' | 'analysis' | 'code' | 'translation' | 'other';
export type Source = 'extension' | 'web' | 'api';
export type EnhancementStyle = 'concise' | 'detailed' | 'creative' | 'technical' | 'balanced';

export interface CreateHistoryRequest {
  original_prompt: string;
  source?: Source;
  intent_category?: IntentCategory;
  tags?: string[];
  meta?: Record<string, any>;
}

export interface UpdateHistoryRequest {
  tags?: string[];
  meta?: Record<string, any>;
  intent_category?: IntentCategory;
}

export interface EnhanceRequest {
  model?: string;
  style?: EnhancementStyle;
}

export interface EnhanceResponse {
  id: string;
  original_prompt: string;
  optimized_prompt: string;
  model: string;
  tokens: number;
  credits_spent: number;
  enhanced_at: string;
}

export interface ListHistoryParams {
  intent_category?: IntentCategory;
  source?: Source;
  date_from?: string;
  date_to?: string;
  q?: string; // search keyword
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  error: string;
  message: string;
  required_credits?: number;
  current_credits?: number;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_HISTORY_PATH = '/api/v2/history';

// Storage interface for JWT
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access: string, refresh: string): Promise<void>;
  clearTokens(): Promise<void>;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

/**
 * History API Client
 */
export class HistoryApiClient {
  private baseUrl: string;
  private tokenStorage: TokenStorage;

  constructor(tokenStorage: TokenStorage, baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.tokenStorage = tokenStorage;
  }

  /**
   * Build headers with JWT
   */
  private async getHeaders(includeIdempotency: boolean = false): Promise<HeadersInit> {
    const token = await this.tokenStorage.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (includeIdempotency) {
      headers['X-Idempotency-Key'] = uuidv4();
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      // Token expired, attempt refresh
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error('RETRY'); // Signal to retry
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'unknown_error',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));

      if (response.status === 402) {
        // Insufficient credits
        throw new InsufficientCreditsError(
          error.message,
          error.required_credits,
          error.current_credits
        );
      }

      throw new ApiClientError(error.message, response.status, error.error);
    }

    return response.json();
  }

  /**
   * Refresh JWT token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.tokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseUrl}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) return false;

      const { access, refresh } = await response.json();
      await this.tokenStorage.setTokens(access, refresh);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Make request with retry logic
   */
  private async request<T>(
    path: string,
    options: RequestInit,
    retries: number = 0
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, options);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // Retry on auth error or network issues
      if (error instanceof Error && error.message === 'RETRY' && retries < MAX_RETRIES) {
        await this.sleep(RETRY_DELAYS[retries]);
        const headers = await this.getHeaders();
        return this.request(path, { ...options, headers }, retries + 1);
      }

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a new history entry
   */
  async create(data: CreateHistoryRequest): Promise<PromptHistory> {
    const headers = await this.getHeaders(true); // Include idempotency key

    return this.request<PromptHistory>(API_HISTORY_PATH + '/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: 'extension',
        ...data,
      }),
    });
  }

  /**
   * List history entries with filters and pagination
   */
  async list(params?: ListHistoryParams): Promise<PaginatedResponse<PromptHistory>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const path = `${API_HISTORY_PATH}/?${queryParams.toString()}`;
    return this.request<PaginatedResponse<PromptHistory>>(path, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Retrieve a single history entry
   */
  async retrieve(id: string): Promise<PromptHistory> {
    const headers = await this.getHeaders();
    return this.request<PromptHistory>(`${API_HISTORY_PATH}/${id}/`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Update a history entry
   */
  async update(id: string, data: UpdateHistoryRequest): Promise<PromptHistory> {
    const headers = await this.getHeaders();
    return this.request<PromptHistory>(`${API_HISTORY_PATH}/${id}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a history entry (soft delete)
   */
  async delete(id: string): Promise<void> {
    const headers = await this.getHeaders();
    return this.request<void>(`${API_HISTORY_PATH}/${id}/`, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * Enhance a prompt
   */
  async enhance(id: string, request?: EnhanceRequest): Promise<EnhanceResponse> {
    const headers = await this.getHeaders(true); // Include idempotency key

    return this.request<EnhanceResponse>(`${API_HISTORY_PATH}/${id}/enhance/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request || {}),
    });
  }
}

// Custom errors
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class InsufficientCreditsError extends Error {
  constructor(
    message: string,
    public requiredCredits?: number,
    public currentCredits?: number
  ) {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}

// Helper to map HTTP status to user-friendly messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof InsufficientCreditsError) {
    return `Insufficient credits. You need ${error.requiredCredits} credits but only have ${error.currentCredits}.`;
  }

  if (error instanceof ApiClientError) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested item was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred.';
}

// Telemetry helper
export function emitTelemetry(event: string, data: Record<string, any>) {
  // Emit to your telemetry service
  console.log(`[Telemetry] ${event}`, data);

  // Example: Send to analytics service
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track(event, data);
  }
}
