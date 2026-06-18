import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getProfil, updateProfil, getProfilPublic, toggleBlocage, supprimerCompte, chercherPourMentions } from '../controllers/utilisateur.controller';
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
router.get('/profile/:uuid', auth, getProfilPublic); // ✨ Modification : Utilisation de :uuid à la place de :id

// Bloquer ou débloquer un utilisateur externe
router.post('/profile/block/:uuid', auth, toggleBlocage); // ✨ Modification : Utilisation de :uuid à la place de :id

// Supprimer son propre profil
router.delete('/profile', auth, supprimerCompte);

// Rechercher des utilisateurs pour les mentions
router.get('/recherche-mentions', auth, chercherPourMentions);

export default router;