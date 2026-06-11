import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Transaction from '../models/transaction.model';
import Confession from '../models/confession.model';
import { generateRoast, generateFutureStory } from '../utils/groq';
import { sendMatchNotification } from '../utils/notifications';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
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
  console.error("Razorpay is not configured for features controller!");
}

const AMOUNT_INR_15 = 1500; // ₹15.00 in paise

/**
 * 1. AI Photo Roast Initiate
 */
export const initiateRoast = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) {
    return next(new AppError("Photo upload is required for the roast feature.", 400));
  }

  // Convert buffer to base64
  const photoBase64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype;

  if (!razorpay) {
    return next(new AppError("Razorpay keys are not configured on the server.", 500));
  }

  // Create real Razorpay order
  const order = await razorpay.orders.create({
    amount: AMOUNT_INR_15,
    currency: 'INR',
    receipt: `receipt_roast_${Date.now()}`
  });

  const user = (req as AuthenticatedRequest).user;
  const transaction = new Transaction({
    userId: user?._id,
    featureType: 'roast',
    paymentStatus: 'pending',
    razorpayOrderId: order.id,
    photoBase64: `data:${mimeType};base64,${photoBase64}`
  });

  await transaction.save();

  res.status(201).json({
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: AMOUNT_INR_15,
    key: razorpayKeyId
  });
});

/**
 * 2. Get AI Photo Roast Result
 */
export const getRoastResult = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { transactionId } = req.params;
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  const user = (req as AuthenticatedRequest).user;
  if (transaction.userId && (!user || transaction.userId.toString() !== user._id.toString())) {
    return next(new AppError("You do not have permission to access this roast.", 403));
  }

  if (transaction.paymentStatus !== 'completed') {
    res.status(402).json({
      message: "Payment required to unlock your roast.",
      paymentStatus: transaction.paymentStatus
    });
    return;
  }

  // Generate roast if not cached
  if (!transaction.roastOutput || transaction.roastOutput.length === 0) {
    if (!transaction.photoBase64) {
      return next(new AppError("Photo missing from transaction.", 400));
    }
    
    // Parse MIME Type
    const match = transaction.photoBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = match ? match[1] : 'image/jpeg';
    
    const roast = await generateRoast(transaction.photoBase64, mimeType);
    transaction.roastOutput = roast;
    transaction.photoBase64 = undefined; // Clear the heavy base64 image data to keep DB storage low
    await transaction.save();
  }

  res.json({
    featureType: transaction.featureType,
    roastOutput: transaction.roastOutput
  });
});

/**
 * 3. AI Future Prediction Game Initiate
 */
export const initiatePredict = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, major, dreamLife } = req.body;

  if (!name || !major || !dreamLife) {
    return next(new AppError("Name, major, and dreamLife description are required.", 400));
  }

  const cleanName = xss(name.trim());
  const cleanMajor = xss(major.trim());
  const cleanDreamLife = xss(dreamLife.trim());

  if (!razorpay) {
    return next(new AppError("Razorpay keys are not configured on the server.", 500));
  }

  // Create real Razorpay order
  const order = await razorpay.orders.create({
    amount: AMOUNT_INR_15,
    currency: 'INR',
    receipt: `receipt_predict_${Date.now()}`
  });

  const user = (req as AuthenticatedRequest).user;
  const transaction = new Transaction({
    userId: user?._id,
    featureType: 'predict',
    paymentStatus: 'pending',
    razorpayOrderId: order.id,
    predictionInputs: { name: cleanName, major: cleanMajor, dreamLife: cleanDreamLife }
  });

  await transaction.save();

  res.status(201).json({
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: AMOUNT_INR_15,
    key: razorpayKeyId
  });
});

/**
 * 4. Get AI Future Prediction Result
 */
export const getPredictResult = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { transactionId } = req.params;
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  const user = (req as AuthenticatedRequest).user;
  if (transaction.userId && (!user || transaction.userId.toString() !== user._id.toString())) {
    return next(new AppError("You do not have permission to access this prediction.", 403));
  }

  if (transaction.paymentStatus !== 'completed') {
    res.status(402).json({
      message: "Payment required to unlock prediction story.",
      paymentStatus: transaction.paymentStatus
    });
    return;
  }

  // Generate prediction if not cached
  if (!transaction.predictionOutput) {
    const inputs = transaction.predictionInputs;
    if (!inputs) {
      return next(new AppError("Prediction inputs missing.", 400));
    }
    const story = await generateFutureStory(inputs.name, inputs.major, inputs.dreamLife);
    transaction.predictionOutput = story;
    await transaction.save();
  }

  res.json({
    featureType: transaction.featureType,
    predictionOutput: transaction.predictionOutput
  });
});

/**
 * 5. Smart Certificate & Rizz Generator Initiate
 */
export const initiateCertificate = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, testType, score, title } = req.body;

  if (!name || !testType || score === undefined || !title) {
    return next(new AppError("Name, testType, score, and title are required.", 400));
  }

  if (!['rizz', 'greenflag', 'audit'].includes(testType)) {
    return next(new AppError("Invalid testType. Must be rizz, greenflag, or audit.", 400));
  }

  const cleanName = xss(name.trim());
  const cleanTitle = xss(title.trim());

  // Assign Badge Color
  let badgeColor = '#a855f7'; // Purple rizz by default
  if (testType === 'greenflag') badgeColor = '#10b981'; // Green flag
  if (testType === 'audit') badgeColor = '#ff2a5f'; // Neon pink profile audit

  if (!razorpay) {
    return next(new AppError("Razorpay keys are not configured on the server.", 500));
  }

  // Create real Razorpay order
  const order = await razorpay.orders.create({
    amount: AMOUNT_INR_15,
    currency: 'INR',
    receipt: `receipt_cert_${Date.now()}`
  });

  const user = (req as AuthenticatedRequest).user;
  const transaction = new Transaction({
    userId: user?._id,
    featureType: 'certificate',
    paymentStatus: 'pending',
    razorpayOrderId: order.id,
    certificateInputs: { name: cleanName, testType, score, title: cleanTitle },
    certificateOutput: { score, title: cleanTitle, badgeColor }
  });

  await transaction.save();

  res.status(201).json({
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: AMOUNT_INR_15,
    key: razorpayKeyId
  });
});

/**
 * 6. Get Smart Certificate Result
 */
export const getCertificateResult = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { transactionId } = req.params;
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  const user = (req as AuthenticatedRequest).user;
  if (transaction.userId && (!user || transaction.userId.toString() !== user._id.toString())) {
    return next(new AppError("You do not have permission to access this certificate.", 403));
  }

  if (transaction.paymentStatus !== 'completed') {
    res.status(402).json({
      message: "Payment required to unlock certificate.",
      paymentStatus: transaction.paymentStatus
    });
    return;
  }

  res.json({
    featureType: transaction.featureType,
    certificateOutput: transaction.certificateOutput,
    certificateInputs: transaction.certificateInputs
  });
});

/**
 * 7. Crush Confession System Initiate
 */
export const initiateConfess = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { creatorName, creatorHandle, creatorContact } = req.body;

  if (!creatorName || !creatorHandle || !creatorContact) {
    return next(new AppError("Your name, Instagram handle, and contact details (WhatsApp/Email) are required.", 400));
  }

  const cleanCreatorName = xss(creatorName.trim());
  const cleanCreatorHandle = xss(creatorHandle.trim());
  const cleanCreatorContact = xss(creatorContact.trim());

  if (!razorpay) {
    return next(new AppError("Razorpay keys are not configured on the server.", 500));
  }

  // Create real Razorpay order
  const order = await razorpay.orders.create({
    amount: AMOUNT_INR_15,
    currency: 'INR',
    receipt: `receipt_confess_${Date.now()}`
  });

  const user = (req as AuthenticatedRequest).user;
  const transaction = new Transaction({
    userId: user?._id,
    featureType: 'confess',
    paymentStatus: 'pending',
    razorpayOrderId: order.id,
    confessInputs: { creatorName: cleanCreatorName, creatorHandle: cleanCreatorHandle, creatorContact: cleanCreatorContact }
  });

  await transaction.save();

  res.status(201).json({
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: AMOUNT_INR_15,
    key: razorpayKeyId
  });
});

/**
 * 8. Get Crush Confession Result (Generates unique shareable link)
 */
export const getConfessResult = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { transactionId } = req.params;
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  const user = (req as AuthenticatedRequest).user;
  if (transaction.userId && (!user || transaction.userId.toString() !== user._id.toString())) {
    return next(new AppError("You do not have permission to access this confession link.", 403));
  }

  if (transaction.paymentStatus !== 'completed') {
    res.status(402).json({
      message: "Payment required to generate confession link.",
      paymentStatus: transaction.paymentStatus
    });
    return;
  }

  const inputs = transaction.confessInputs;
  if (!inputs) {
    return next(new AppError("Confession inputs missing.", 400));
  }

  // Check if a confession document already exists for this transaction
  let confession = await Confession.findOne({ userId: transactionId });

  if (!confession) {
    const secretToken = crypto.randomBytes(16).toString('hex');
    confession = new Confession({
      userId: transactionId, // Using the transactionId as the unique slug directly is clean and secure
      secretToken,
      creatorName: inputs.creatorName,
      creatorHandle: inputs.creatorHandle,
      creatorContact: inputs.creatorContact,
      attempts: [],
      matched: false
    });
    await confession.save();
  }

  res.json({
    featureType: transaction.featureType,
    userId: confession.userId,
    secretToken: confession.secretToken,
    confessionUrl: `/confess/${confession.userId}`,
    matched: confession.matched,
    matchedWith: confession.matchedWith
  });
});

/**
 * 9. Get Confession Details (Public Page)
 */
export const getConfessionDetails = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.params;
  const confession = await Confession.findOne({ userId });

  if (!confession) {
    return next(new AppError("Confession link not found or expired.", 404));
  }

  res.json({
    creatorName: confession.creatorName,
    matched: confession.matched
  });
});

/**
 * 10. Submit Confession Attempt (Match Logic)
 */
export const submitConfessionAttempt = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.params;
  const { guessName, contactInfo } = req.body;

  if (!guessName || !contactInfo) {
    return next(new AppError("Guess name and your contact details are required.", 400));
  }

  const cleanGuessName = xss(guessName.trim());
  const cleanContactInfo = xss(contactInfo.trim());

  const confession = await Confession.findOne({ userId });
  if (!confession) {
    return next(new AppError("Confession link not found.", 404));
  }

  if (confession.matched) {
    res.json({
      matched: true,
      matchedWith: confession.matchedWith,
      message: "This link has already hit a Match! Both parties have been notified."
    });
    return;
  }

  // Normalize Strings for Matching
  const cleanInput = cleanGuessName.trim().toLowerCase().replace(/^@/, '');
  const cleanCreatorName = confession.creatorName.trim().toLowerCase();
  const cleanCreatorHandle = confession.creatorHandle.trim().toLowerCase().replace(/^@/, '');

  const isMatch = (cleanInput === cleanCreatorName || cleanInput === cleanCreatorHandle);

  if (isMatch) {
    confession.matched = true;
    confession.matchedWith = cleanGuessName;
    confession.attempts.push({
      guessName: cleanGuessName,
      contactInfo: cleanContactInfo,
      matched: true,
      createdAt: new Date()
    });

    await confession.save();

    // Trigger email/console notification
    await sendMatchNotification(
      confession.creatorName,
      confession.creatorContact,
      cleanGuessName,
      cleanContactInfo
    );

    res.json({
      matched: true,
      message: `🎉 IT'S A MATCH! You matched with ${confession.creatorName}. Both of you have been notified!`
    });
  } else {
    confession.attempts.push({
      guessName: cleanGuessName,
      contactInfo: cleanContactInfo,
      matched: false,
      createdAt: new Date()
    });

    await confession.save();

    res.json({
      matched: false,
      message: "Your confession has been recorded anonymously. If there's a match, they will be notified!"
    });
  }
});
