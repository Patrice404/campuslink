import { Router } from 'express';
import { getDepartementsByCampus, getFormationsByDepartement } from '../controllers/academique.controller';

const router = Router();

router.get('/campus/:campusId/departements', getDepartementsByCampus);
router.get('/departements/:departementId/formations', getFormationsByDepartement);

export default router;