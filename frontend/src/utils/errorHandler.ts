import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public data?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface ErrorResponse {
  message: string;
  code?: string;
  data?: any;
}

export function handleApiError(error: unknown, context?: string): ErrorResponse {
  // Log the error
  logger.error('API Error occurred', {
    context,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Handle known error types
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      data: error.data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Handle unknown errors
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

export function createApiError(
  message: string,
  code: string = 'UNKNOWN_ERROR',
  statusCode: number = 500,
  data?: any
): AppError {
  return new AppError(message, code, statusCode, data);
}

// Common error codes
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Error messages for common scenarios
export const ErrorMessages = {
  [ErrorCodes.UNAUTHORIZED]: 'You must be logged in to perform this action',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCodes.NETWORK_ERROR]: 'Network error occurred. Please check your connection',
  [ErrorCodes.SERVER_ERROR]: 'Server error occurred. Please try again later',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred',
} as const;

// Helper function to create validation errors
export function createValidationError(fields: Record<string, string>): AppError {
  return createApiError(
    ErrorMessages[ErrorCodes.VALIDATION_ERROR],
    ErrorCodes.VALIDATION_ERROR,
    400,
    { fields }
  );
}

// Helper function to create not found errors
export function createNotFoundError(resource: string): AppError {
  return createApiError(
    `${resource} not found`,
    ErrorCodes.NOT_FOUND,
    404
  );
}

// Helper function to create unauthorized errors
export function createUnauthorizedError(): AppError {
  return createApiError(
    ErrorMessages[ErrorCodes.UNAUTHORIZED],
    ErrorCodes.UNAUTHORIZED,
    401
  );
}

// Helper function to create forbidden errors
export function createForbiddenError(): AppError {
  return createApiError(
    ErrorMessages[ErrorCodes.FORBIDDEN],
    ErrorCodes.FORBIDDEN,
    403
  );
} 