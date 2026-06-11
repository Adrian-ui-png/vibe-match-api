import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/transaction.model';
import { generateReport, getTierDetails } from '../utils/reportGenerator';
import { questions } from '../utils/questions';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import xss from 'xss';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Initialize Razorpay
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpay: Razorpay | null = null;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
} else {
  console.error("CRITICAL: Razorpay keys are not configured in environment variables!");
}

/**
 * Get all hardcoded quiz questions (instant load)
 */
export const getQuestions = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const cleanQuestions = questions.map(q => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options.map(opt => ({
      optionId: opt.optionId,
      optionText: opt.optionText
    }))
  }));
  res.json(cleanQuestions);
});

/**
 * Process answers, calculate score & tier, and generate Razorpay order
 */
export const submitQuiz = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { self, crush, answers } = req.body;

  if (!self || !crush || !answers || !Array.isArray(answers)) {
    return next(new AppError("Invalid payload. Self, crush name, and answers array are required.", 400));
  }

  const cleanSelf = xss(self.trim());
  const cleanCrush = xss(crush.trim());

  // Secure server-side calculation from hardcoded questions
  let totalScore = 0;
  
  for (const ans of answers) {
    const q = questions.find(item => item.id === Number(ans.questionId));
    if (!q) continue;

    const selectedOption = q.options.find(opt => opt.optionId === ans.optionId);
    if (!selectedOption) continue;

    totalScore += selectedOption.points;
  }

  // Bound total score between 12 and 60
  if (totalScore < 12) totalScore = 12;
  if (totalScore > 60) totalScore = 60;

  // Get tier based on total score
  const details = getTierDetails(totalScore);

  if (!razorpay) {
    return next(new AppError("Razorpay keys are not configured on the server.", 500));
  }

  const amountInPaise = 1500; // ₹15.00

  // Create real Razorpay order
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_quiz_${Date.now()}`
  });

  const user = (req as AuthenticatedRequest).user;
  const transaction = new Transaction({
    userId: user?._id,
    userNames: { self: cleanSelf, crush: cleanCrush },
    totalScore: totalScore,
    tier: details.tier,
    paymentStatus: 'pending',
    razorpayOrderId: order.id
  });

  await transaction.save();

  res.status(201).json({
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: amountInPaise,
    totalScore: totalScore,
    tier: details.tier,
    key: razorpayKeyId
  });
});

/**
 * Get unlocked report & Crush Hacks
 */
export const getReport = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { transactionId } = req.params;

  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  const user = (req as AuthenticatedRequest).user;
  if (transaction.userId && (!user || transaction.userId.toString() !== user._id.toString())) {
    return next(new AppError("You do not have permission to view this report.", 403));
  }

  // Check payment status
  if (transaction.paymentStatus !== 'completed') {
    res.status(402).json({
      message: "Payment required to unlock this report",
      paymentStatus: transaction.paymentStatus,
      totalScore: transaction.totalScore!
    });
    return;
  }

  // Generate and cache report if not already cached
  if (!transaction.unlockedReport) {
    transaction.unlockedReport = generateReport(
      transaction.userNames!.self,
      transaction.userNames!.crush,
      transaction.totalScore!
    );
    await transaction.save();
  }

  res.json({
    userNames: transaction.userNames,
    totalScore: transaction.totalScore,
    tier: transaction.tier,
    unlockedReport: transaction.unlockedReport
  });
});
