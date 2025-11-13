import { NextRequest, NextResponse } from 'next/server';
import type { ApiRequest, ApiResponse } from '@/lib/api-playground/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiRequest: ApiRequest = await request.json();

    // Build the URL with query parameters
    const url = new URL(apiRequest.url);
    apiRequest.queryParams
      .filter((param) => param.enabled && param.key)
      .forEach((param) => {
        url.searchParams.append(param.key, param.value);
      });

    // Build headers
    const headers: Record<string, string> = {};

    // Add custom headers
    apiRequest.headers
      .filter((header) => header.enabled && header.key)
      .forEach((header) => {
        headers[header.key] = header.value;
      });

    // Handle authentication
    if (apiRequest.auth.type === 'bearer' && apiRequest.auth.bearer?.token) {
      headers['Authorization'] = `Bearer ${apiRequest.auth.bearer.token}`;
    } else if (apiRequest.auth.type === 'basic' && apiRequest.auth.basic) {
      const credentials = btoa(
        `${apiRequest.auth.basic.username}:${apiRequest.auth.basic.password}`
      );
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (apiRequest.auth.type === 'api-key' && apiRequest.auth.apiKey) {
      if (apiRequest.auth.apiKey.addTo === 'header') {
        headers[apiRequest.auth.apiKey.key] = apiRequest.auth.apiKey.value;
      } else {
        url.searchParams.append(
          apiRequest.auth.apiKey.key,
          apiRequest.auth.apiKey.value
        );
      }
    } else if (apiRequest.auth.type === 'oauth2' && apiRequest.auth.oauth2?.accessToken) {
      const tokenType = apiRequest.auth.oauth2.tokenType || 'Bearer';
      headers['Authorization'] = `${tokenType} ${apiRequest.auth.oauth2.accessToken}`;
    }

    // Build body
    let body: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(apiRequest.method)) {
      if (apiRequest.body.type === 'json' && apiRequest.body.json) {
        body = apiRequest.body.json;
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      } else if (apiRequest.body.type === 'raw' && apiRequest.body.raw) {
        body = apiRequest.body.raw;
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'text/plain';
        }
      } else if (apiRequest.body.type === 'form-data' && apiRequest.body.formData) {
        const formData = new FormData();
        apiRequest.body.formData
          .filter((item) => item.enabled && item.key)
          .forEach((item) => {
            formData.append(item.key, item.value);
          });
        body = formData;
      } else if (
        apiRequest.body.type === 'x-www-form-urlencoded' &&
        apiRequest.body.urlEncoded
      ) {
        const params = new URLSearchParams();
        apiRequest.body.urlEncoded
          .filter((item) => item.enabled && item.key)
          .forEach((item) => {
            params.append(item.key, item.value);
          });
        body = params.toString();
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }
    }

    // Execute the request
    const startTime = Date.now();
    const response = await fetch(url.toString(), {
      method: apiRequest.method,
      headers,
      body: body ? (typeof body === 'string' ? body : body) : undefined,
    });
    const endTime = Date.now();

    // Parse response
    let data: any;
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      data = await response.text();
    }

    // Build response headers object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Calculate response size
    const size = new Blob([
      typeof data === 'string' ? data : JSON.stringify(data),
    ]).size;

    // Build API response
    const apiResponse: ApiResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data,
      time: endTime - startTime,
      size,
    };

    return NextResponse.json(apiResponse);
  } catch (error: any) {
    console.error('API Playground Execute Error:', error);

    // Return error response
    return NextResponse.json(
      {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: {
          error: true,
          message: error.message || 'Failed to execute request',
          details: error.toString(),
        },
        time: 0,
        size: 0,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
