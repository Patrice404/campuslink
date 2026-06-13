import { Router } from 'express';
import { prisma } from '../lib/prismaClient'; // Instance partagée

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    // Ici, tu ajouteras plus tard la vérification du mot de passe avec bcrypt
    res.json({ message: "Login réussi", user });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;