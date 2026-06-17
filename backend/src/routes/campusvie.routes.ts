import { Router } from 'express';
import { getCampusAnnonces } from '../controllers/campusvie.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', auth, getCampusAnnonces);

export default router;