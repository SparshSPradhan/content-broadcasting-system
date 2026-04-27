export class AppError extends Error {
    constructor(
      public message: string,
      public statusCode: number = 500,
      public code?: string,
    ) {
      super(message);
      this.name = 'AppError';
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string, public details?: unknown) {
      super(message, 400, 'VALIDATION_ERROR');
      this.name = 'ValidationError';
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
      super(message, 401, 'UNAUTHORIZED');
      this.name = 'UnauthorizedError';
    }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
      super(message, 403, 'FORBIDDEN');
      this.name = 'ForbiddenError';
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
      super(message, 404, 'NOT_FOUND');
      this.name = 'NotFoundError';
    }
  }
  
  export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
      super(message, 409, 'CONFLICT');
      this.name = 'ConflictError';
    }
  }