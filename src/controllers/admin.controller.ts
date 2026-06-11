import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import Transaction from '../models/transaction.model';
import AuditLog from '../models/auditLog.model';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const totalUsers = await User.countDocuments();
  const completedTransactions = await Transaction.countDocuments({ paymentStatus: 'completed' });
  const pendingTransactions = await Transaction.countDocuments({ paymentStatus: 'pending' });

  // Calculate total revenue (₹15 per transaction)
  const totalRevenue = completedTransactions * 15;

  const recentTransactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    status: 'success',
    stats: {
      totalUsers,
      completedTransactions,
      pendingTransactions,
      totalRevenue,
      recentTransactions
    }
  });
});

export const getAuditLogs = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    status: 'success',
    logs
  });
});

export const getUsersList = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const users = await User.find({}, '-passwordHash')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    users
  });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.params;
  const { role, plan } = req.body;
  const adminUser = (req as AuthenticatedRequest).user;

  if (!role && !plan) {
    return next(new AppError('Please specify role or plan to update.', 400));
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return next(new AppError('User not found.', 404));
  }

  const prevRole = targetUser.role;
  const prevPlan = targetUser.plan;

  if (role) targetUser.role = role;
  if (plan) targetUser.plan = plan;

  await targetUser.save();

  // Log in AuditLog
  await AuditLog.create({
    userId: adminUser?._id,
    actorEmail: adminUser?.email || 'admin',
    action: 'admin.update_user',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    metadata: {
      targetUserId: targetUser._id,
      targetEmail: targetUser.email,
      updates: {
        role: role ? { from: prevRole, to: role } : undefined,
        plan: plan ? { from: prevPlan, to: plan } : undefined
      }
    }
  });

  logger.info(`Admin updated user role/plan: ${targetUser.email} (Role: ${role}, Plan: ${plan})`);

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully.',
    user: {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      plan: targetUser.plan
    }
  });
});
