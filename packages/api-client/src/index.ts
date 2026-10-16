export class ApiError extends Error {
  status: number;
  data?: unknown;
  correlationId?: string;

  constructor(message: string, status = 500, data?: unknown, correlationId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.correlationId = correlationId;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
  baseUrl?: string;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export function getDefaultBaseUrl(): string {
  if (typeof process !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    if (process.env.API_URL) return process.env.API_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:4100';
  }
  return 'https://transport-backend-pzlp.onrender.com';
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = options.baseUrl || getDefaultBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;
  const correlationId = `req-${Math.random().toString(36).substring(2, 9)}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Correlation-Id': correlationId,
    ...(options.headers || {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let bodyContent: string | undefined;
  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json';
    bodyContent = JSON.stringify(options.body);
  }

  try {
    const timeoutSignal =
      options.signal ||
      (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(15000)
        : typeof AbortController !== 'undefined'
          ? (() => {
              const c = new AbortController();
              setTimeout(() => { try { c.abort(); } catch {} }, 15000);
              return c.signal;
            })()
          : undefined);

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: bodyContent,
      signal: timeoutSignal,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const result = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        typeof result === 'object' && result !== null && 'error' in result
          ? String((result as { error: unknown }).error)
          : response.statusText || 'API request failed';
      throw new ApiError(message, response.status, result, correlationId);
    }

    return result as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const errorMsg = (err as Error).name === 'TimeoutError'
      ? 'Network request timed out. Please retry.'
      : (err as Error).message || 'Network connection failed.';
    throw new ApiError(errorMsg, 0, null, correlationId);
  }
}

export const api = apiClient;
