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
    let isAdminUser = false; // ✨ Drapeau pour repérer l'admin

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
        
        // ✨ Protection : On isole le rôle ADMIN pour ne pas faire cracher Prisma
        if (infoUtilisateur.role === 'ADMIN') {
          isAdminUser = true;
        } else if (infoUtilisateur.role) {
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
    const condition: any = {
      id_utilisateur: { notIn: excludedUserIds },
      sousType: { notIn: ['FETE', 'EVENEMENT', 'HACKATHON'] as any }, 
    };

    // ✨ Si ce n'est pas un admin, on applique les restrictions de visibilité habituelles
    if (!isAdminUser) {
      condition.OR = [
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
      ];
    }

    // 3. Requête Prisma avec inclusion globale + table des Jaimes
    const opportunites = await prisma.annonceBonPlan.findMany({
      where: condition,
      include: {
        utilisateur: true,
        jaimes: true // <--- CORRECTION AJOUTÉE ICI
      },
      orderBy: {
        datePublication: 'desc'
      }
    });

    // 4. Calcul dynamique de l'état réactif attendu par ton Layout et AnnonceCard
    const formatAnnonces = opportunites.map(op => {
      const jaimesArray = op.jaimes || [];
      
      // On regarde si l'utilisateur connecté (sous forme de String) a un like existant
      const isLikedByMe = idConnectedStr
        ? jaimesArray.some((j: any) => String(j.id_utilisateur) === idConnectedStr)
        : false;

      return {
        ...op,
        nbJaime: op.nbJaime || 0,
        isLikedByMe // Booléen envoyé directement au Front-end
      };
    });

    res.status(200).json(toJSON(formatAnnonces));
  } catch (error) {
    console.error("Erreur lors de la récupération des opportunités :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des opportunités." });
  }
};