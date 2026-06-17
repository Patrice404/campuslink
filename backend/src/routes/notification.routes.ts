import { Router } from 'express';
import { lister, marquerLue } from '../controllers/notification.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', auth, lister);
router.put('/:id/lire', auth, marquerLue);

export default router;