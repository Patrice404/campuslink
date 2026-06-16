import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { toggle } from '../controllers/jaime.controller';
import { listerParAnnonce } from '../controllers/commentaire.controller';
import { auth } from '../middlewares/auth.middleware';
import { uploadImageMiddleware } from '../middlewares/file_upload.middlewares';
import {
  //lister,
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
//router.get('/', auth, lister);
router.get('/mes', auth, mesAnnonces);
 
// Endpoints dédiés de création par type d'annonce
router.post('/exercice', auth, uploadImageMiddleware, createExercice);
router.post('/bonplan', auth, uploadImageMiddleware, createBonPlan);
router.post('/tutorat', auth, uploadImageMiddleware, createTutorat);
router.post('/projet', auth, uploadImageMiddleware, createProjet);
 
//router.put('/:id', auth, uploadImageMiddleware, modifier);


// Endpoint générique (conservé)
router.post('/', auth, upload.single('image'), creer);
 
router.get('/:id', detail);
router.put('/:id', auth, upload.single('image'), modifier);
router.delete('/:id', auth, supprimer);
router.post('/:id/jaime', auth, toggle);
// Commentaires d'une annonce (param ?type= recommandé)
router.get('/:id/commentaires', auth, listerParAnnonce);


//Ancien code (avant la refonte pour les types d'annonces spécifiques)
// ordre important : /mes avant /:id pour éviter que "mes" soit capturé comme id
/*router.get('/', lister);
router.get('/mes', auth, mesAnnonces);
router.get('/:id', detail);
router.post('/', auth, upload.single('image'), creer);
router.put('/:id', auth, upload.single('image'), modifier);
router.delete('/:id', auth, supprimer);
router.post('/:id/jaime', auth, toggle);
*/
export default router;
