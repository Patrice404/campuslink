import { Request, Response } from 'express';
// 🛠️ CORRECTION : On utilise l'instance prisma partagée et configurée du projet
import { prisma } from '../lib/prismaClient'; 
import { toJSON } from '../lib/serialize';


// Récupérer toutes les annonces de la vie du campus (Bons plans / Événements)
export const getCampusAnnonces = async (req: Request, res: Response): Promise<void> => {
  try {
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;
    let blockedUserIds: bigint[] = [];

    if (idConnected) {
      const blocages = await prisma.blocage.findMany({
        where: { id_utilisateur_bloquant: idConnected },
        select: { id_utilisateur_bloque: true }
      });
      blockedUserIds = blocages.map(b => b.id_utilisateur_bloque);
    }

    const bonsPlans = await prisma.annonceBonPlan.findMany({
      where: {
        id_utilisateur: { notIn: blockedUserIds }
      },
      include: {
        utilisateur: true // Utilise l'inclusion complète configurée par le client global
      },
      orderBy: {
        datePublication: 'desc'
      }
    });

    const formatAnnonces = bonsPlans.map(bp => ({
      ...bp,
      nbJaime: bp.nbJaime || 0
    }));

    res.status(200).json(toJSON(formatAnnonces));
  } catch (error) {
    console.error("Erreur lors de la récupération des annonces campus :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des actualités du campus." });
  }
};