import { Router } from 'express';
import { creer, modifier, supprimer } from '../controllers/commentaire.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', auth, creer);
router.put('/:id', auth, modifier);
router.delete('/:id', auth, supprimer);

export default router;
