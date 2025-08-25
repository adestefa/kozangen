// Error processing utilities
import { ApiError } from '@/lib/types/api';

export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, code: string, statusCode = 500, isOperational = true) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class ServiceError extends AppError {
  constructor(message: string, service: string) {
    super(message, `${service.toUpperCase()}_ERROR`, 500);
  }
}

export class FileSystemError extends AppError {
  constructor(message: string) {
    super(message, 'FILESYSTEM_ERROR', 500);
  }
}

export function formatApiError(error: unknown): ApiError {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: {
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: {
      originalError: error
    },
    timestamp
  };
}

export function logError(error: unknown, context?: string) {
  const formattedError = formatApiError(error);
  
  console.error(`[ERROR${context ? ` - ${context}` : ''}]:`, {
    ...formattedError,
    timestamp: formattedError.timestamp
  });

  // TODO: Send to external logging service in production
}

export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError && error.isOperational;
}

// Mock error simulation for development
export function simulateRandomError(chance = 0.1): void {
  if (Math.random() < chance) {
    const errors = [
      new ServiceError('Python script execution failed', 'huhu'),
      new ValidationError('Invalid image format provided'),
      new FileSystemError('Cannot access input directory'),
      new AppError('Network timeout', 'NETWORK_ERROR', 503)
    ];
    
    throw errors[Math.floor(Math.random() * errors.length)];
  }
}

// TODO: Add error recovery strategies
// TODO: Add error metrics collection
// TODO: Add user-friendly error messages mapping