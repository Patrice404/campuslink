import { Router } from 'express';
import { lister } from '../controllers/campus.controller';

const router = Router();

router.get('/', lister);

export default router;
