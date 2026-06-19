import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { toggle } from '../controllers/jaime.controller';
import { listerParAnnonce } from '../controllers/commentaire.controller';
import { auth } from '../middlewares/auth.middleware';
import { uploadImageMiddleware } from '../middlewares/file_upload.middlewares';
import {
  lister,
  detail,
  mesAnnonces,
  createExercice,
  createBonPlan,
  createTutorat,
  createProjet,
  supprimerAnnonce,
  modifierAnnonce,
  toggleLike,
  recherche,
} from '../controllers/annonce.controller';
import { getBonPlanSubTypes } from '../controllers/bonPlan.controller';


const router = Router();
 
// ordre important : routes spécifiques avant /:id pour éviter toute capture ambiguë
router.get('/', auth, lister);
router.get('/mes', auth, mesAnnonces);
// Recherche à tags (type, matiere, annee, auteur, has, avant/apres, q) — avant /:id
router.get('/recherche', auth, recherche);
router.get('/bonplan/soustypes', getBonPlanSubTypes);

// Endpoints dédiés de création par type d'annonce
router.post('/exercice', auth, uploadImageMiddleware, createExercice);
router.post('/bonplan', auth, uploadImageMiddleware, createBonPlan);
router.post('/tutorat', auth, uploadImageMiddleware, createTutorat);
router.post('/projet', auth, uploadImageMiddleware, createProjet);

// Ex: PUT /api/annonces/tutorat/42
router.put('/:type/:id', auth, uploadImageMiddleware, modifierAnnonce);
// Ex: DELETE /api/annonces/tutorat/42
router.delete('/:type/:id', auth, supprimerAnnonce);
// Ex: POST /api/annonces/tutorat/42/like
router.post('/:type/:id/like', auth, toggleLike);

// Endpoint générique (conservé)
 
router.get('/:id', detail);
//router.put('/:id', auth, upload.single('image'), modifier);
router.post('/:id/jaime', auth, toggle);
// Commentaires d'une annonce (param ?type= recommandé)
router.get('/:id/commentaires', auth, listerParAnnonce);

export default router;
