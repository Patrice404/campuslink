import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { lister, detail, mesAnnonces, creer, modifier, supprimer } from '../controllers/annonce.controller';
import { toggle } from '../controllers/jaime.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ordre important : /mes avant /:id pour éviter que "mes" soit capturé comme id
router.get('/', lister);
router.get('/mes', auth, mesAnnonces);
router.get('/:id', detail);
router.post('/', auth, upload.single('image'), creer);
router.put('/:id', auth, upload.single('image'), modifier);
router.delete('/:id', auth, supprimer);
router.post('/:id/jaime', auth, toggle);

export default router;
