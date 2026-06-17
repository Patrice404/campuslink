import { Router } from 'express';
import { getProjets } from '../controllers/projet.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Route protégée pour récupérer le fil de projets
router.get('/', auth, getProjets);

export default router;