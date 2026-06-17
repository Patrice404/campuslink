import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';

// 1. Récupérer tous les utilisateurs bloqués par la personne connectée
export const getBlockedUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;

    if (!idConnected) {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }

    // Trouver tous les blocages créés par l'utilisateur connecté
    const blocages = await prisma.blocage.findMany({
      where: { id_utilisateur_bloquant: idConnected },
      select: { id_utilisateur_bloque: true }
    });

    const blockedIds = blocages.map(b => b.id_utilisateur_bloque);

    // Récupérer le profil public de ces utilisateurs bloqués
    const utilisateursBloques = await prisma.utilisateur.findMany({
      where: { id: { in: blockedIds } },
      select: {
        id: true,
        prenom: true,
        nom: true,
        photoProfil: true,
        role: true
      }
    });

    res.status(200).json(toJSON(utilisateursBloques));
  } catch (error) {
    console.error("Erreur dans getBlockedUsers :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des blocages." });
  }
};

// 2. Débloquer un utilisateur
export const unblockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;
    const idToUnblock = req.params.id ? BigInt(req.params.id) : null;

    if (!idConnected || !idToUnblock) {
      res.status(400).json({ message: "Données manquantes ou incorrectes" });
      return;
    }

    // Supprimer la ligne de blocage correspondante
    await prisma.blocage.deleteMany({
      where: {
        id_utilisateur_bloquant: idConnected,
        id_utilisateur_bloque: idToUnblock
      }
    });

    res.status(200).json({ message: "Utilisateur débloqué avec succès." });
  } catch (error) {
    console.error("Erreur dans unblockUser :", error);
    res.status(500).json({ message: "Erreur serveur lors du déblocage." });
  }
};