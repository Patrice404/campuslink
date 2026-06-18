import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { toJSON } from '../lib/serialize';

const prisma = new PrismaClient();

// Configuration des rangs académiques identique à tes autres fichiers
const ENTRAIDE_LEVEL_RANKS: Record<string, number> = {
  'L1': 1, 'L2': 2, 'L3': 3, 'M1': 4, 'M2': 5,
  '1A': 1, '2A': 2, '3A': 3, '4A': 4, '5A': 5
};

// Récupérer toutes les annonces d'entraide / exercices avec filtres de sécurité
export const getExercices = async (req: Request, res: Response): Promise<void> => {
  try {
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;
    const idConnectedStr = req.utilisateur ? String(req.utilisateur.id) : null;

    let excludedUserIds: bigint[] = [];
    let allowedVisibilities: string[] = ['PUBLIQUE'];
    let userFormationId: bigint | null = null;
    let allowedAuthorNiveaux: string[] = [];
    let isAdminUser = false; // ✨ Drapeau pour identifier le rôle ADMIN

    // 1. Extraction des règles de sécurité (Blocages réciproques et Visibilité)
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
        
        // ✨ Isolation du rôle ADMIN pour éviter d'injecter une valeur invalide dans Prisma
        if (infoUtilisateur.role === 'ADMIN') {
          isAdminUser = true;
        } else if (infoUtilisateur.role) {
          allowedVisibilities.push(infoUtilisateur.role);
        }

        if (infoUtilisateur.formation) {
          const currentNiveau = infoUtilisateur.formation.niveau;
          const currentRank = ENTRAIDE_LEVEL_RANKS[currentNiveau] || 0;
          allowedAuthorNiveaux = Object.keys(ENTRAIDE_LEVEL_RANKS).filter(
            niv => ENTRAIDE_LEVEL_RANKS[niv] <= currentRank
          );
        }
      }
    }

    // 2. Construction de la condition de visibilité globale
    const condition: any = {
      id_utilisateur: { notIn: excludedUserIds } // Exclusion des utilisateurs bloqués
    };

    // ✨ Si l'utilisateur n'est pas ADMIN, on applique le filtrage classique
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

    // 3. Exécution de la requête avec la clause 'where' sécurisée
    const exercices = await prisma.annonceExercice.findMany({
      where: condition,
      include: {
        utilisateur: {
          select: {
            id: true,
            uuid: true,
            prenom: true,
            nom: true,
            photoProfil: true
          }
        },
        matiere: true,
        jaimes: true // Incontournable pour garder le bouton de Like fonctionnel
      },
      orderBy: {
        datePublication: 'desc'
      }
    });

    // 4. FORMATAGE ET COUCHE DE RÉACTIVITÉ DU LIKE
    const formatEtudiants = exercices.map(exo => {
      const jaimesArray = exo.jaimes || [];
      
      // On vérifie si l'utilisateur connecté est présent dans le tableau des likes
      const isLikedByMe = idConnectedStr 
        ? jaimesArray.some((j: any) => String(j.id_utilisateur) === idConnectedStr) 
        : false;

      return {
        ...exo,
        nbJaime: exo.nbJaime || 0,
        isLikedByMe // Injecté proprement pour ton Layout et AnnonceCard
      };
    });

    res.status(200).json(toJSON(formatEtudiants));
  } catch (error) {
    console.error("Erreur lors du chargement des exercices sécurisés :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des entraides." });
  }
};