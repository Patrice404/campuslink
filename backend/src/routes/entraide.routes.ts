import { Router } from 'express';
import { getExercices } from '../controllers/entraide.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Route protégée pour récupérer le fil d'entraide
router.get('/', auth, getExercices);

export default router;