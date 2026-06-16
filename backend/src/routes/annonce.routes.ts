import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { toggle } from '../controllers/jaime.controller';
import { auth } from '../middlewares/auth.middleware';
import {
  lister,
  detail,
  mesAnnonces,
  creer,
  modifier,
  supprimer,
  createExercice,
  createBonPlan,
  createTutorat,
  createProjet,
} from '../controllers/annonce.controller';


const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });


 
// ordre important : routes spécifiques avant /:id pour éviter toute capture ambiguë
router.get('/', auth, lister);
router.get('/mes', auth, mesAnnonces);
 
// Endpoints dédiés de création par type d'annonce
router.post('/exercice', auth, upload.single('image'), createExercice);
router.post('/bonplan', auth, upload.single('image'), createBonPlan);
router.post('/tutorat', auth, upload.single('image'), createTutorat);
router.post('/projet', auth, upload.single('image'), createProjet);
 
// Endpoint générique (conservé)
router.post('/', auth, upload.single('image'), creer);
 
router.get('/:id', detail);
router.put('/:id', auth, upload.single('image'), modifier);
router.delete('/:id', auth, supprimer);
router.post('/:id/jaime', auth, toggle);


//Ancien code (avant la refonte pour les types d'annonces spécifiques)
// ordre important : /mes avant /:id pour éviter que "mes" soit capturé comme id
router.get('/', lister);
router.get('/mes', auth, mesAnnonces);
router.get('/:id', detail);
router.post('/', auth, upload.single('image'), creer);
router.put('/:id', auth, upload.single('image'), modifier);
router.delete('/:id', auth, supprimer);
router.post('/:id/jaime', auth, toggle);

export default router;
