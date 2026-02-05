import { Response } from 'express';

interface ApiResponse<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export function successResponse<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    ok: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown
): Response {
  const response: ApiResponse = {
    ok: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
}

// Special response format for availability check (maintains API contract)
export function availabilityResponse(
  res: Response,
  available: boolean,
  message: string
): Response {
  return res.status(200).json({
    ok: true,
    available,
    message,
  });
}
