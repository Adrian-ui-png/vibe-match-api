import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';
import User, { IUser } from '../models/user.model';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new AppError('JWT_SECRET is not configured on the server.', 500));
    }
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new AppError('JWT_SECRET is not configured on the server.', 500));
    }
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    const user = await User.findById(decoded.id);
    if (user) {
      (req as AuthenticatedRequest).user = user;
    }
    next();
  } catch (error) {
    // Continue as guest even if token is invalid or expired
    next();
  }
};

export const requireRole = (roles: Array<'admin' | 'user'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }
    next();
  };
};
