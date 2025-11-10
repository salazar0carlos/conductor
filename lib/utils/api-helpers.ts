import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof Error) {
    return apiError(error.message, 500)
  }

  return apiError('An unexpected error occurred', 500)
}
