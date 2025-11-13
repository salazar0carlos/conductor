import type {
  ApiRequest,
  KeyValue,
  Environment,
  HttpMethod,
} from './types';

/**
 * Replace environment variables in a string
 */
export function replaceVariables(
  text: string,
  environments: Environment[]
): string {
  const activeEnv = environments.find((env) => env.isActive);
  if (!activeEnv) return text;

  let result = text;
  activeEnv.variables
    .filter((v) => v.enabled)
    .forEach((variable) => {
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      result = result.replace(regex, variable.value);
    });

  return result;
}

/**
 * Build full URL with query parameters
 */
export function buildUrl(
  baseUrl: string,
  queryParams: KeyValue[]
): string {
  const enabledParams = queryParams.filter((p) => p.enabled && p.key);
  if (enabledParams.length === 0) return baseUrl;

  const params = new URLSearchParams();
  enabledParams.forEach((param) => {
    params.append(param.key, param.value);
  });

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}

/**
 * Convert headers array to object
 */
export function headersToObject(headers: KeyValue[]): Record<string, string> {
  const result: Record<string, string> = {};
  headers
    .filter((h) => h.enabled && h.key)
    .forEach((header) => {
      result[header.key] = header.value;
    });
  return result;
}

/**
 * Parse JSON safely
 */
export function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Format JSON with indentation
 */
export function formatJson(data: any): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Calculate response size
 */
export function calculateSize(data: any): number {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return new Blob([str]).size;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format milliseconds to human readable
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get status code color
 */
export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600';
  if (status >= 300 && status < 400) return 'text-blue-600';
  if (status >= 400 && status < 500) return 'text-orange-600';
  if (status >= 500) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Get HTTP method color
 */
export function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    GET: 'text-green-600 bg-green-50 border-green-200',
    POST: 'text-blue-600 bg-blue-50 border-blue-200',
    PUT: 'text-orange-600 bg-orange-50 border-orange-200',
    PATCH: 'text-purple-600 bg-purple-50 border-purple-200',
    DELETE: 'text-red-600 bg-red-50 border-red-200',
    HEAD: 'text-gray-600 bg-gray-50 border-gray-200',
    OPTIONS: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[method];
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create empty request
 */
export function createEmptyRequest(): ApiRequest {
  return {
    id: generateId(),
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    auth: { type: 'none' },
    body: { type: 'none' },
    description: '',
  };
}

/**
 * Create empty key-value pair
 */
export function createEmptyKeyValue(): KeyValue {
  return {
    id: generateId(),
    key: '',
    value: '',
    enabled: true,
  };
}

/**
 * Export collection to Postman format
 */
export function exportToPostman(collection: any): string {
  // Convert to Postman Collection v2.1 format
  const postmanCollection = {
    info: {
      name: collection.name,
      description: collection.description || '',
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: collection.requests.map((req: ApiRequest) => ({
      name: req.name,
      request: {
        method: req.method,
        header: req.headers
          .filter((h: KeyValue) => h.enabled)
          .map((h: KeyValue) => ({
            key: h.key,
            value: h.value,
            description: h.description || '',
          })),
        url: {
          raw: req.url,
          query: req.queryParams
            .filter((q: KeyValue) => q.enabled)
            .map((q: KeyValue) => ({
              key: q.key,
              value: q.value,
              description: q.description || '',
            })),
        },
        body:
          req.body.type === 'json'
            ? {
                mode: 'raw',
                raw: req.body.json || '',
                options: {
                  raw: {
                    language: 'json',
                  },
                },
              }
            : undefined,
        description: req.description || '',
      },
    })),
  };

  return JSON.stringify(postmanCollection, null, 2);
}

/**
 * Import from Postman format
 */
export function importFromPostman(jsonString: string): any {
  try {
    const postmanCollection = JSON.parse(jsonString);

    const requests: ApiRequest[] = (postmanCollection.item || []).map(
      (item: any) => {
        const req = item.request || {};
        return {
          id: generateId(),
          name: item.name || 'Untitled Request',
          method: (req.method || 'GET') as HttpMethod,
          url: typeof req.url === 'string' ? req.url : req.url?.raw || '',
          headers: (req.header || []).map((h: any) => ({
            id: generateId(),
            key: h.key || '',
            value: h.value || '',
            enabled: !h.disabled,
            description: h.description || '',
          })),
          queryParams:
            (typeof req.url === 'object' ? req.url.query || [] : []).map(
              (q: any) => ({
                id: generateId(),
                key: q.key || '',
                value: q.value || '',
                enabled: !q.disabled,
                description: q.description || '',
              })
            ) || [],
          auth: { type: 'none' },
          body: req.body
            ? {
                type: req.body.mode === 'raw' ? 'json' : 'none',
                json: req.body.raw || '',
              }
            : { type: 'none' },
          description: item.description || req.description || '',
        };
      }
    );

    return {
      id: generateId(),
      name: postmanCollection.info?.name || 'Imported Collection',
      description: postmanCollection.info?.description || '',
      requests,
      folders: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (error) {
    throw new Error('Invalid Postman collection format');
  }
}

/**
 * Get content type from body type
 */
export function getContentType(bodyType: string): string | null {
  const contentTypes: Record<string, string> = {
    json: 'application/json',
    'form-data': 'multipart/form-data',
    'x-www-form-urlencoded': 'application/x-www-form-urlencoded',
    raw: 'text/plain',
  };
  return contentTypes[bodyType] || null;
}
