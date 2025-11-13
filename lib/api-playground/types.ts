export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export type AuthType =
  | 'none'
  | 'bearer'
  | 'basic'
  | 'api-key'
  | 'oauth2';

export type BodyType =
  | 'none'
  | 'json'
  | 'form-data'
  | 'x-www-form-urlencoded'
  | 'raw'
  | 'binary';

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface AuthConfig {
  type: AuthType;
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  apiKey?: {
    key: string;
    value: string;
    addTo: 'header' | 'query';
  };
  oauth2?: {
    accessToken: string;
    tokenType?: string;
  };
}

export interface RequestBody {
  type: BodyType;
  raw?: string;
  json?: string;
  formData?: KeyValue[];
  urlEncoded?: KeyValue[];
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  auth: AuthConfig;
  body: RequestBody;
  preRequestScript?: string;
  tests?: string;
  description?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
  cookies?: Record<string, string>;
}

export interface RequestHistory {
  id: string;
  request: ApiRequest;
  response?: ApiResponse;
  timestamp: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: ApiRequest[];
  folders: CollectionFolder[];
  createdAt: number;
  updatedAt: number;
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  requests: string[]; // request IDs
  folders: CollectionFolder[];
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  isActive: boolean;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  secret: boolean;
  description?: string;
}

export interface CodeGeneratorOptions {
  language:
    | 'javascript-fetch'
    | 'javascript-axios'
    | 'python'
    | 'curl'
    | 'php'
    | 'ruby'
    | 'go'
    | 'java';
}

export interface ApiDocumentation {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  isPublic: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    favicon?: string;
  };
  sections: DocSection[];
}

export interface DocSection {
  id: string;
  title: string;
  description: string;
  requests: string[]; // request IDs
  order: number;
}

export interface MockServer {
  id: string;
  name: string;
  url: string;
  routes: MockRoute[];
  isActive: boolean;
}

export interface MockRoute {
  id: string;
  method: HttpMethod;
  path: string;
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
    delay?: number;
  };
}
