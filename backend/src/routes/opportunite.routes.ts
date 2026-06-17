import { Router } from 'express';
import { getOpportunites } from '../controllers/opportunite.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Route protégée pour récupérer le fil des opportunités
router.get('/', auth, getOpportunites);

export default router;