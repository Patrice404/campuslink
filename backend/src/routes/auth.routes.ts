import { Router } from 'express';
import { inscription, connexion, me } from '../controllers/auth.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/inscription', inscription);
router.post('/connexion', connexion);
router.get('/me', auth, me);

export default router;
