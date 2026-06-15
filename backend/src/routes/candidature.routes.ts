import { Router } from 'express';
import { postuler, updateStatut, annuler } from '../controllers/candidature.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', auth, postuler);
router.put('/:id/statut', auth, updateStatut);
router.delete('/:id', auth, annuler);

export default router;
