import { Router } from 'express';
import { lister } from '../controllers/matiere.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/matieres : liste des matières (protégée, comme le reste de l'app)
router.get('/', auth, lister);

export default router;