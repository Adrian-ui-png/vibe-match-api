import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production Mode: Hide programmer leaks
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Unhandled programming error
      console.error('CRITICAL INTERNAL ERROR 💥:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong on our server. Please try again later.'
      });
    }
  }
};
