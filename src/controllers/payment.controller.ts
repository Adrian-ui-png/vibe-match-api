import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Transaction from '../models/transaction.model';
import { generateReport } from '../utils/reportGenerator';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

/**
 * Handle incoming Razorpay Webhook events
 */
export const handleWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature) {
    return next(new AppError("Missing Razorpay signature header", 400));
  }

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured in env variables.");
    return next(new AppError("Webhook secret not configured on server", 500));
  }

  // Verify signature
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn("Invalid webhook signature received");
    return next(new AppError("Invalid signature", 400));
  }

  const event = req.body;
  console.log(`Razorpay Webhook Event: ${event.event}`);

  let orderId = '';
  let paymentId = '';

  if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
    orderId = event.payload.payment.entity.order_id;
    paymentId = event.payload.payment.entity.id;
  } else if (event.event === 'order.paid') {
    orderId = event.payload.order.entity.id;
    paymentId = event.payload.payment?.entity?.id || 'paid_event';
  }

  if (!orderId) {
    res.json({ status: 'ok', message: 'Ignored non-order event' });
    return;
  }

  // Update transaction and unlock report
  const transaction = await Transaction.findOne({ razorpayOrderId: orderId });
  if (!transaction) {
    console.warn(`No transaction found for order ID: ${orderId}`);
    return next(new AppError("Transaction not found", 404));
  }

  if (transaction.paymentStatus !== 'completed') {
    transaction.paymentStatus = 'completed';
    transaction.razorpayPaymentId = paymentId;

    // Only generate quiz report if the feature is 'quiz' (or unset) AND not session-based
    if ((!transaction.featureType || transaction.featureType === 'quiz') && !transaction.sessionId) {
      if (transaction.userNames && transaction.totalScore !== undefined) {
        transaction.unlockedReport = generateReport(
          transaction.userNames.self,
          transaction.userNames.crush,
          transaction.totalScore
        );
      }
    }

    await transaction.save();
    console.log(`Successfully completed payment for order: ${orderId} (${transaction.featureType || 'quiz'})`);
  }

  res.json({ status: 'ok', message: 'Report unlocked successfully' });
});

/**
 * Verify Razorpay payment signature synchronously
 */
export const verifyPayment = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return next(new AppError("Missing payment verification parameters (order_id, payment_id, signature).", 400));
  }

  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpayKeySecret) {
    console.error("RAZORPAY_KEY_SECRET is not configured in env variables.");
    return next(new AppError("Webhook secret not configured on server", 500));
  }

  // Verify signature mathematically: HMAC_SHA256(order_id + "|" + payment_id, secret)
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    console.warn("Invalid signature verification attempt received");
    return next(new AppError("Payment signature verification failed", 400));
  }

  // Update transaction and unlock report
  const transaction = await Transaction.findOne({ razorpayOrderId });
  if (!transaction) {
    console.warn(`No transaction found for order ID: ${razorpayOrderId}`);
    return next(new AppError("Transaction not found", 404));
  }

  if (transaction.paymentStatus !== 'completed') {
    transaction.paymentStatus = 'completed';
    transaction.razorpayPaymentId = razorpayPaymentId;

    // Trigger report generation for quiz
    if ((!transaction.featureType || transaction.featureType === 'quiz') && !transaction.sessionId) {
      if (transaction.userNames && transaction.totalScore !== undefined) {
        transaction.unlockedReport = generateReport(
          transaction.userNames.self,
          transaction.userNames.crush,
          transaction.totalScore
        );
      }
    }

    await transaction.save();
    console.log(`Successfully completed payment via manual verify for order: ${razorpayOrderId} (${transaction.featureType || 'quiz'})`);
  }

  res.json({
    status: 'success',
    message: 'Payment verified and completed successfully.'
  });
});


