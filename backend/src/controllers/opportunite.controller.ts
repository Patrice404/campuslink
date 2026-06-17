import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient'; 
import { toJSON } from '../lib/serialize';

const LEVEL_RANKS: Record<string, number> = {
  'L1': 1, 'L2': 2, 'L3': 3, 'M1': 4, 'M2': 5,
  '1A': 1, '2A': 2, '3A': 3, '4A': 4, '5A': 5
};

export const getOpportunites = async (req: Request, res: Response): Promise<void> => {
  try {
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;
    const idConnectedStr = req.utilisateur ? String(req.utilisateur.id) : null;

    let excludedUserIds: bigint[] = [];
    let allowedVisibilities: string[] = ['PUBLIQUE'];
    let userFormationId: bigint | null = null;
    let allowedAuthorNiveaux: string[] = [];

    // 1. Extraction des règles de sécurité et visibilité
    if (idConnected) {
      const blocages = await prisma.blocage.findMany({
        where: {
          OR: [
            { id_utilisateur_bloquant: idConnected },
            { id_utilisateur_bloque: idConnected }
          ]
        },
        select: { id_utilisateur_bloquant: true, id_utilisateur_bloque: true }
      });

      const excludedSet = new Set<bigint>();
      blocages.forEach(b => {
        if (b.id_utilisateur_bloquant !== idConnected) excludedSet.add(b.id_utilisateur_bloquant);
        if (b.id_utilisateur_bloque !== idConnected) excludedSet.add(b.id_utilisateur_bloque);
      });
      excludedUserIds = Array.from(excludedSet);

      const infoUtilisateur = await prisma.utilisateur.findUnique({
        where: { id: idConnected },
        include: { formation: true }
      });

      if (infoUtilisateur) {
        userFormationId = infoUtilisateur.id_formation;
        if (infoUtilisateur.role) {
          allowedVisibilities.push(infoUtilisateur.role);
        }

        if (infoUtilisateur.formation) {
          const currentNiveau = infoUtilisateur.formation.niveau;
          const currentRank = LEVEL_RANKS[currentNiveau] || 0;
          allowedAuthorNiveaux = Object.keys(LEVEL_RANKS).filter(
            niv => LEVEL_RANKS[niv] <= currentRank
          );
        }
      }
    }

   // 2. Application de la condition croisée (Sécurité + Restriction de catégories)
    const condition = {
      id_utilisateur: { notIn: excludedUserIds },
      
      // 🛠️ LA CORRECTION : On ajoute également "as any" ici
      sousType: { notIn: ['FETE', 'EVENEMENT', 'HACKATHON'] as any }, 
      
      OR: [
        ...(idConnected ? [{ id_utilisateur: idConnected }] : []),
        { visibilite: { in: allowedVisibilities as any } },
        ...(userFormationId ? [{
          AND: [
            { visibilite: 'PROMOTION' as const },
            { utilisateur: { id_formation: userFormationId } }
          ]
        }] : []),
        ...(allowedAuthorNiveaux.length > 0 ? [{
          AND: [
            { visibilite: 'PROMO_SUPERIEUR' as const },
            { utilisateur: { formation: { niveau: { in: allowedAuthorNiveaux } } } }
          ]
        }] : [])
      ]
    };

    const opportunites = await prisma.annonceBonPlan.findMany({
      where: condition,
      include: {
        utilisateur: true
      },
      orderBy: {
        datePublication: 'desc'
      }
    });

    const formatAnnonces = opportunites.map(op => ({
      ...op,
      nbJaime: op.nbJaime || 0
    }));

    res.status(200).json(toJSON(formatAnnonces));
  } catch (error) {
    console.error("Erreur lors de la récupération des opportunités :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des opportunités." });
  }
};