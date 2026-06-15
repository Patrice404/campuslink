import { Router } from 'express';
import { lister } from '../controllers/hashtag.controller';

const router = Router();

router.get('/', lister);

export default router;
