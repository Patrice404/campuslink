import { Router } from 'express';
import { getBlockedUsers, unblockUser } from '../controllers/settings.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/blocked', auth, getBlockedUsers);
router.delete('/blocked/:id', auth, unblockUser);

export default router;