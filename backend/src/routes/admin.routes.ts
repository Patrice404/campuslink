import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { getAllUsers, deleteUser } from '../controllers/admin.controller';

const router = Router();

// Route des statistiques
router.get('/statistiques', auth, isAdmin, (req, res) => {
  res.json({
    message: "Bienvenue dans le cockpit, Commandant !",
    stats: { totalUtilisateurs: 8, signalementsEnAttente: 0 }
  });
});

// 👥 Routes de gestion des utilisateurs
router.get('/utilisateurs', auth, isAdmin, getAllUsers);
router.delete('/utilisateurs/:id', auth, isAdmin, deleteUser);

export default router;