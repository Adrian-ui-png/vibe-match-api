import { Router } from 'express';
import { signup, login, getProfile, getMyTransactions } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', requireAuth, getProfile);
router.get('/transactions', requireAuth, getMyTransactions);

export default router;
