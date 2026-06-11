import { Request, Response, NextFunction } from 'express';
import Message from '../models/message.model';
import Transaction from '../models/transaction.model';

/**
 * Middleware that limits free users to exactly 3 chat messages.
 * On the 4th message, it throws a 402 error to trigger the frontend paywall.
 */
export const checkPaywall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const sessionId = req.body.sessionId || req.query.sessionId || req.params.sessionId;

  if (!sessionId) {
    res.status(400).json({ status: 'fail', message: 'sessionId is required.' });
    return;
  }

  try {
    const isPaid = await Transaction.exists({ sessionId, paymentStatus: 'completed' });

    if (!isPaid) {
      res.status(402).json({
        status: 'fail',
        message: 'Payment of ₹15 required to access this AI feature.',
        paywall: true,
        sessionId
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Paywall check error:", error);
    next(error);
  }
};
