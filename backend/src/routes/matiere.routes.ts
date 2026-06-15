import { Router } from 'express';
import { lister } from '../controllers/matiere.controller';

const router = Router();

router.get('/', lister);

export default router;
