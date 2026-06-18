import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { toJSON } from '../lib/serialize';

const prisma = new PrismaClient();

// Configuration des rangs académiques identique à tes autres fichiers
const LEVEL_RANKS: Record<string, number> = {
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

    // 1. EXTRACTION DES RÈGLES DE SÉCURITÉ (Blocages et Visibilités autorisées)
    if (idConnected) {
      // Gestion des utilisateurs bloqués / bloquants
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

      // Récupération des détails sur la formation et le rôle de l'utilisateur
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

    // 2. CONSTRUCTION DE LA REQUÊTE SÉCURISÉE AVEC FILTRES CROISÉS
    const condition = {
      // Masquer les exercices rédigés par un utilisateur bloqué
      id_utilisateur: { notIn: excludedUserIds },
      
      // Gestion fine des niveaux de visibilité (Même logique que Projets / Opportunités)
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

    // 3. REQUÊTE PRISMA AVEC INCLUSIONS
    const exercices = await prisma.annonceExercice.findMany({
      where: condition,
      include: {
        utilisateur: {
          select: {
            id: true,
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