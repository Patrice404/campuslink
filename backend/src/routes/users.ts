import { Router } from 'express';
import { prisma } from '../lib/prismaClient'; // Instance partagée

const router = Router();

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
});

export default router;