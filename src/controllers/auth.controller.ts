import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import AuditLog from '../models/auditLog.model';
import Transaction from '../models/transaction.model';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const signToken = (id: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any
  });
};

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email and password.', 400));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address.', 400));
  }

  // Validate password strength (at least 8 chars)
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long.', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email is already registered.', 400));
  }

  // Securely hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    name,
    email,
    passwordHash
  });

  const token = signToken(newUser._id.toString());

  // Log audit event
  await AuditLog.create({
    userId: newUser._id,
    actorEmail: newUser.email,
    action: 'auth.signup',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    metadata: { name: newUser.name }
  });

  logger.info(`New user registered: ${newUser.email}`);

  res.status(201).json({
    status: 'success',
    token,
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      plan: newUser.plan
    }
  });
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    // Audit log failed login
    await AuditLog.create({
      actorEmail: email,
      action: 'auth.login_failed',
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { reason: 'Invalid credentials' }
    });
    logger.warn(`Failed login attempt for email: ${email}`);
    return next(new AppError('Incorrect email or password.', 401));
  }

  const token = signToken(user._id.toString());

  // Log successful audit event
  await AuditLog.create({
    userId: user._id,
    actorEmail: user.email,
    action: 'auth.login_success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  logger.info(`User logged in successfully: ${user.email}`);

  res.status(200).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan
    }
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return next(new AppError('User session not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan
    }
  });
});

export const getMyTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return next(new AppError('User session not found.', 404));
  }

  const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    transactions
  });
});
