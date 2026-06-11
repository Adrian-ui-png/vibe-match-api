import { Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import Message from '../models/message.model';
import Transaction from '../models/transaction.model';
import { generateChatResponse, generatePaidInsights } from '../utils/groq';
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
}

const AMOUNT_INR_15 = 1500; // ₹15.00 in paise

/**
 * 1. Initiate Chat Session
 */
export const initiateChat = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionId, featureType, photoBase64, name } = req.body;

  if (!sessionId || !featureType) {
    return next(new AppError("sessionId and featureType are required.", 400));
  }

  const user = (req as AuthenticatedRequest).user;

  // Clear existing messages for this session (restart fresh)
  if (user) {
    await Message.deleteMany({ sessionId, userId: user._id });
  } else {
    await Message.deleteMany({ sessionId, userId: { $exists: false } });
  }

  let greeting = '';
  if (featureType === 'quiz') {
    greeting = "Yo! I'm your Gen-Z Relationship Guru. Let's check if your crush is a soulmate or a dry texter in disguise. First, who's the crush, and what's the current vibes between you guys?";
  } else if (featureType === 'roast') {
    if (!photoBase64) {
      return next(new AppError("photoBase64 upload is required to initiate a roast audit.", 400));
    }
    
    // Check if transaction exists to save the photo
    await Transaction.findOneAndUpdate(
      { sessionId, userId: user?._id },
      { photoBase64, featureType: 'roast', userId: user?._id },
      { upsert: true, new: true }
    );

    // Call Groq to get initial roast based on photo
    const initialHistory = [{ sender: 'user' as const, text: "Here is my profile picture. Start the conversation by giving me a brutal opening roast about it." }];
    const parseMime = photoBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = parseMime ? parseMime[1] : 'image/jpeg';
    
    const sysPrompt = "You are a brutally critical, extremely nitpicky, and sarcastic Indian Gen-Z campus mentor who roasts profile pictures. You must not be nice at all. Find every single tiny visual flaw or styling problem in the photo (hair, posture, lighting, quality, clutter, face) and start the chat with a savage, funny opening roast under 3 sentences.";
    greeting = await generateChatResponse(initialHistory, sysPrompt, photoBase64, mimeType);
  } else if (featureType === 'predict') {
    greeting = "Welcome to 2035 manifestation central! I'm your futuristic fortune teller. Tell me your name, current major or job, and 3 words describing your dream life. Let's see if you're a millionaire or still crying over split bills.";
  } else {
    return next(new AppError("Invalid featureType.", 400));
  }

  // Save AI response as first message
  const initMsg = new Message({
    sessionId,
    userId: user?._id,
    sender: 'guru',
    text: greeting
  });
  await initMsg.save();

  res.status(200).json({
    status: 'success',
    message: initMsg
  });
});

/**
 * 2. Send Message (Dynamic turn conversation)
 */
export const sendMessage = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionId, text, featureType } = req.body;

  if (!sessionId || !text || !featureType) {
    return next(new AppError("sessionId, text, and featureType are required.", 400));
  }

  const user = (req as AuthenticatedRequest).user;
  const cleanTextMsg = xss(text.trim());

  // Save user's message
  const userMsg = new Message({
    sessionId,
    userId: user?._id,
    sender: 'user',
    text: cleanTextMsg
  });
  await userMsg.save();

  // Get full session history
  const historyQuery = user ? { sessionId, userId: user._id } : { sessionId, userId: { $exists: false } };
  const rawHistory = await Message.find(historyQuery).sort({ createdAt: 1 });
  const formattedHistory = rawHistory.map(m => ({
    sender: m.sender,
    text: m.text
  }));

  // Determine System Instruction
  let sysInstruction = '';
  if (featureType === 'quiz') {
    sysInstruction = "You are an authentic, extremely witty, slightly sarcastic Indian Gen-Z relationship guru campus mentor. Ask engaging questions about their crush one by one to determine compatibility. Keep answers punchy and short (under 3 sentences per turn). Evaluate their vibe index dynamically. At the end of each response, output their compatibility vibe score in the format [VIBE_SCORE: X] (where X is 0-100) based on their answers so far. Do not mention this score format in conversation.";
  } else if (featureType === 'roast') {
    sysInstruction = "You are an extremely nitpicky, brutally critical, and sarcastic Indian Gen-Z campus mentor who roasts profile pictures and feeds. You must not be nice. Roast every small problem, flaw, or detail in their profile picture and styling. Give savage, funny pop-culture roasts and sarcasm. Keep answers punchy and short (under 3 sentences per turn). Ask critical questions about their feed layout, follower ratio, or bio to find more things to roast.";
  } else if (featureType === 'predict') {
    sysInstruction = "You are a dramatic, futuristic Indian Gen-Z manifestations coach and fortune teller. Ask them about their career/wealth/love dreams. Evaluate how realistic or chaotic their approach is. Keep answers punchy and short (under 3 sentences per turn). At the end of each response, output a future timeline progress in the format [TIMELINE: Y] (where Y is a headline like '2028: Iced Latte Bankruptcy') summarizing a future milestone up to the year 2035. Do not mention this format in conversation.";
  } else {
    return next(new AppError("Invalid featureType.", 400));
  }

  // Fetch base64 photo if this is roast feature
  let photoBase64;
  let mimeType;
  if (featureType === 'roast') {
    const txQuery = (user ? { sessionId, userId: user._id, featureType: 'roast' } : { sessionId, userId: { $exists: false }, featureType: 'roast' }) as any;
    const tx = await Transaction.findOne(txQuery);
    if (tx && tx.photoBase64) {
      photoBase64 = tx.photoBase64;
      const parseMime = photoBase64.match(/^data:(image\/\w+);base64,/);
      mimeType = parseMime ? parseMime[1] : 'image/jpeg';
    }
  }

  // Get response from Groq
  const responseText = await generateChatResponse(formattedHistory, sysInstruction, photoBase64, mimeType);

  // Extract score or timeline tags
  let vibeScore: number | undefined;
  let timeline: string | undefined;
  let cleanText = responseText;

  if (featureType === 'quiz') {
    const scoreMatch = responseText.match(/\[VIBE_SCORE:\s*(\d+)\]/);
    if (scoreMatch) {
      vibeScore = parseInt(scoreMatch[1]);
      cleanText = responseText.replace(/\[VIBE_SCORE:\s*\d+\]/, '').trim();
    }
  } else if (featureType === 'predict') {
    const timelineMatch = responseText.match(/\[TIMELINE:\s*(.*?)\]/);
    if (timelineMatch) {
      timeline = timelineMatch[1];
      cleanText = responseText.replace(/\[TIMELINE:\s*.*?\]/, '').trim();
    }
  }

  // Save AI response
  const aiMsg = new Message({
    sessionId,
    userId: user?._id,
    sender: 'guru',
    text: cleanText
  });
  await aiMsg.save();

  res.status(200).json({
    status: 'success',
    message: aiMsg,
    vibeScore,
    timeline
  });
});

/**
 * 3. Initiate Chat Payment (₹15 Order)
 */
export const initiateChatPayment = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionId, featureType, self, crush } = req.body;

  if (!sessionId || !featureType) {
    return next(new AppError("sessionId and featureType are required to initiate payment.", 400));
  }

  const user = (req as AuthenticatedRequest).user;

  // Check if there is already a completed transaction for this session
  const checkQuery = (user ? { sessionId, userId: user._id, paymentStatus: 'completed' } : { sessionId, userId: { $exists: false }, paymentStatus: 'completed' }) as any;
  const alreadyCompleted = await Transaction.findOne(checkQuery);
  if (alreadyCompleted) {
    res.status(200).json({
      status: 'success',
      alreadyPaid: true,
      transactionId: alreadyCompleted._id
    });
    return;
  }

  if (!razorpay) {
    return next(new AppError("Razorpay keys are not configured on the server.", 500));
  }

  // Create real Razorpay order
  const order = await razorpay.orders.create({
    amount: AMOUNT_INR_15,
    currency: 'INR',
    receipt: `receipt_chat_${Date.now()}`
  });

  const cleanSelf = self ? xss(self.trim()) : undefined;
  const cleanCrush = crush ? xss(crush.trim()) : undefined;

  const txQuery = (user ? { sessionId, userId: user._id } : { sessionId, userId: { $exists: false } }) as any;
  const transaction = await Transaction.findOneAndUpdate(
    txQuery,
    {
      featureType,
      paymentStatus: 'pending',
      razorpayOrderId: order.id,
      userId: user?._id,
      userNames: cleanSelf && cleanCrush ? { self: cleanSelf, crush: cleanCrush } : undefined
    },
    { upsert: true, new: true }
  );

  res.status(201).json({
    transactionId: transaction._id,
    razorpayOrderId: order.id,
    amount: AMOUNT_INR_15,
    key: razorpayKeyId
  });
});

/**
 * 4. Unlock Paid Dynamic Insights
 */
export const unlockChatInsights = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionId } = req.params;

  const user = (req as AuthenticatedRequest).user;

  const txQuery = (user ? { sessionId, userId: user._id, paymentStatus: 'completed' } : { sessionId, userId: { $exists: false }, paymentStatus: 'completed' }) as any;
  const transaction = await Transaction.findOne(txQuery);
  if (!transaction) {
    res.status(402).json({
      status: 'fail',
      message: "Payment required to unlock insights.",
      paymentStatus: 'pending'
    });
    return;
  }

  // Return cached insights if already generated
  if (transaction.unlockedInsights) {
    res.status(200).json({
      status: 'success',
      insights: transaction.unlockedInsights
    });
    return;
  }

  // Retrieve chat logs
  const historyQuery = user ? { sessionId, userId: user._id } : { sessionId, userId: { $exists: false } };
  const history = await Message.find(historyQuery).sort({ createdAt: 1 });
  if (history.length === 0) {
    res.status(200).json({
      status: 'success',
      paymentStatus: 'completed',
      message: "Payment completed. Ready to start chat."
    });
    return;
  }

  // Format metaData for username inclusion
  const metaData = {
    name: transaction.userNames?.self || 'User',
    crush: transaction.userNames?.crush || 'Crush'
  };

  const formattedHistory = history.map(m => ({
    sender: m.sender,
    text: m.text
  }));

  // Generate dynamic insights
  const insights = await generatePaidInsights(formattedHistory, transaction.featureType as any, metaData);

  // Cache insights
  transaction.unlockedInsights = insights;
  if (transaction.featureType === 'roast') {
    transaction.photoBase64 = undefined; // Discard heavy base64 profile picture once chat insights are unlocked
  }
  await transaction.save();

  res.status(200).json({
    status: 'success',
    insights
  });
});
