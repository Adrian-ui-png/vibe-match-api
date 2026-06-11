import { Router } from 'express';
import { getQuestions, submitQuiz, getReport } from '../controllers/quiz.controller';
import { handleWebhook, verifyPayment } from '../controllers/payment.controller';
import { uploadPhoto, validateImageSignature } from '../middleware/upload.middleware';
import { checkPaywall } from '../middleware/paywall.middleware';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import authRouter from './auth.routes';
import adminRouter from './admin.routes';
import {
  initiateRoast,
  getRoastResult,
  initiatePredict,
  getPredictResult,
  initiateCertificate,
  getCertificateResult,
  initiateConfess,
  getConfessResult,
  getConfessionDetails,
  submitConfessionAttempt
} from '../controllers/features.controller';
import {
  initiateChat,
  sendMessage,
  initiateChatPayment,
  unlockChatInsights
} from '../controllers/chat.controller';

const router = Router();

// Authentication and Admin Panel routes
router.use('/auth', authRouter);
router.use('/admin', adminRouter);

// Quiz routes (v1 static)
router.get('/quiz/questions', getQuestions);
router.post('/quiz/submit', optionalAuth, submitQuiz);
router.get('/quiz/report/:transactionId', optionalAuth, getReport);

// Payment routes
router.post('/payment/webhook', handleWebhook);
router.post('/payment/verify', verifyPayment);

// AI Roast routes (v1 static)
router.post('/features/roast/initiate', optionalAuth, uploadPhoto.single('photo'), validateImageSignature, initiateRoast);
router.get('/features/roast/result/:transactionId', optionalAuth, getRoastResult);

// AI Predict routes (v1 static)
router.post('/features/predict/initiate', optionalAuth, initiatePredict);
router.get('/features/predict/result/:transactionId', optionalAuth, getPredictResult);

// Smart Certificate routes (v1 static)
router.post('/features/certificate/initiate', optionalAuth, initiateCertificate);
router.get('/features/certificate/result/:transactionId', optionalAuth, getCertificateResult);

// Crush Confession routes (v1 static)
router.post('/features/confess/initiate', optionalAuth, initiateConfess);
router.get('/features/confess/result/:transactionId', optionalAuth, getConfessResult);

// Public Confession Matching (requires no auth as it is done by the crush)
router.get('/features/confess/details/:userId', getConfessionDetails);
router.post('/features/confess/attempt/:userId', submitConfessionAttempt);

// Live Chat API routes (Conversational v2)
router.post('/chat/initiate', optionalAuth, checkPaywall, initiateChat);
router.post('/chat/message', optionalAuth, checkPaywall, sendMessage);
router.post('/chat/pay', optionalAuth, initiateChatPayment);
router.get('/chat/unlock/:sessionId', optionalAuth, unlockChatInsights);

export default router;
