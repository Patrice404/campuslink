import { Router } from 'express';
//import { lister, marquerLue, marquerToutesLues } from '../controllers/notification.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

//router.get('/', auth, lister);
// /lire-tout avant /:id pour éviter conflit de paramètre
//router.put('/lire-tout', auth, marquerToutesLues);
//router.put('/:id/lue', auth, marquerLue);

export default router;
