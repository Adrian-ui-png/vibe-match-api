import { Router } from 'express';
import { getDashboardStats, getAuditLogs, getUsersList, updateUserRole } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Restrict all routes to authenticated users with role 'admin'
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/stats', getDashboardStats);
router.get('/logs', getAuditLogs);
router.get('/users', getUsersList);
router.patch('/user/:userId', updateUserRole);

export default router;
