import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`💥 [Error] ${req.method} ${req.url} - Status: ${status} - Message: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({
    error: message,
    status
  });
}
