import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

// 1. Récupérer la liste de tous les utilisateurs
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        photoProfil: true
        // ✨ On a supprimé id_campus d'ici
      },
      orderBy: { nom: 'asc' }
    });

    // On convertit uniquement le BigInt de l'id en string pour le JSON
    const cleanUsers = utilisateurs.map(user => ({
      ...user,
      id: user.id.toString()
    }));

    res.status(200).json(cleanUsers);
  } catch (error) {
    console.error("Erreur dans getAllUsers :", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des utilisateurs." });
  }
};

// 2. Supprimer définitivement un utilisateur (Bannissement)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id ? BigInt(req.params.id) : null;

    if (!userId) {
      res.status(400).json({ error: "ID d'utilisateur manquant ou invalide." });
      return;
    }

    await prisma.utilisateur.delete({
      where: { id: userId }
    });

    res.status(200).json({ success: true, message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error("Erreur dans deleteUser :", error);
    res.status(500).json({ error: "Impossible de supprimer cet utilisateur." });
  }
};