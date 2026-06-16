import { Router } from 'express';
import {
  inscription,
  connexion,
  me,
  sendVerification,
  verifyAndRegister,
} from '../controllers/auth.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Inscription en 2 étapes (vérification email avant création du compte)
router.post('/send-verification', sendVerification);
router.post('/verify-and-register', verifyAndRegister);

// Inscription directe (sans vérification) — conservée
router.post('/inscription', inscription);
router.post('/connexion', connexion);
router.get('/me', auth, me);

export default router;
