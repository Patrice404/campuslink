import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getProfil, updateProfil, getProfilPublic } from '../controllers/utilisateur.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Mon profil (utilisateur connecté)
router.get('/profile', auth, getProfil);
router.put('/profile', auth, upload.single('photo'), updateProfil);
// Parcourir le profil public d'un autre utilisateur
router.get('/profile/:id', auth, getProfilPublic);

export default router;
