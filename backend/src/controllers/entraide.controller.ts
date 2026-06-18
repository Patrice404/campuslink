import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

const prisma = new PrismaClient();

// Configuration des rangs académiques identique à tes autres fichiers
const ENTRAIDE_LEVEL_RANKS: Record<string, number> = {
  'L1': 1, 'L2': 2, 'L3': 3, 'M1': 4, 'M2': 5,
  '1A': 1, '2A': 2, '3A': 3, '4A': 4, '5A': 5
};

// Utilitaire de sérialisation récursive pour nettoyer les BigInt avant l'envoi JSON
const deepSerializeBigInt = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(deepSerializeBigInt);

  const newObj = { ...obj };
  for (const key in newObj) {
    if (typeof newObj[key] === 'bigint') {
      newObj[key] = newObj[key].toString();
    } else if (typeof newObj[key] === 'object') {
      newObj[key] = deepSerializeBigInt(newObj[key]);
    }
  }
  return newObj;
};

// Récupérer toutes les annonces d'entraide (Exercices ET Tutorats) avec filtres de sécurité
export const getExercices = async (req: Request, res: Response): Promise<void> => {
  try {
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;
    const idConnectedStr = req.utilisateur ? String(req.utilisateur.id) : null;

    let excludedUserIds: bigint[] = [];
    let allowedVisibilities: string[] = ['PUBLIQUE'];
    let userFormationId: bigint | null = null;
    let allowedAuthorNiveaux: string[] = [];
    let isAdminUser = false; // Drapeau pour identifier le rôle ADMIN

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
        
        // Isolation du rôle ADMIN pour éviter d'injecter une valeur invalide dans Prisma
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

    // 2. Construction de la condition de visibilité globale (Nettoyée du doublon de merge)
    const condition: any = {
      id_utilisateur: { notIn: excludedUserIds } // Exclusion des utilisateurs bloqués
    };

    // Si l'utilisateur n'est pas ADMIN, on applique le filtrage classique
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

<<<<<<< HEAD
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
=======
    // 3. REQUÊTES PARALLÈLES SUR LES DEUX TABLES (Exercices et Tutorats)
    const [exercices, tutorats] = await Promise.all([
      prisma.annonceExercice.findMany({
        where: condition,
        include: {
          utilisateur: {
            select: { id: true, prenom: true, nom: true, photoProfil: true }
          },
          matiere: true,
          jaimes: true
        }
      }),
      prisma.annonceTutorat.findMany({
        where: condition,
        include: {
          utilisateur: {
            select: { id: true, prenom: true, nom: true, photoProfil: true }
          },
          matiere: true,
          jaimes: true
        }
      })
    ]);
>>>>>>> 1c6eb07dc0b49c7764da9fd04d994a4aaa8b6267

    // 4. FUSION ET TRI PAR DATE DÉCROISSANTE
    const entraideGlobale = [
      ...exercices.map(exo => ({ ...exo, sousTypeTypeFront: 'EXERCICE', type: 'AnnonceExercice' })),
      ...tutorats.map(tut => ({ ...tut, sousTypeTypeFront: 'TUTORAT', type: 'AnnonceTutorat' }))
    ];

    entraideGlobale.sort(
      (a, b) => new Date(b.datePublication).getTime() - new Date(a.datePublication).getTime()
    );

    // 5. COUCHE DE RÉACTIVITÉ DU LIKE (isLikedByMe)
    const formatEntraide = entraideGlobale.map(item => {
      const jaimesArray = item.jaimes || [];
      const isLikedByMe = idConnectedStr 
        ? jaimesArray.some((j: any) => String(j.id_utilisateur) === idConnectedStr) 
        : false;

      return {
        ...item,
        nbJaime: item.nbJaime || 0,
        isLikedByMe
      };
    });

    // 6. ENVOI SÉCURISÉ SANS PLANTAGE DE BIGINT
    res.status(200).json(deepSerializeBigInt(formatEntraide));
  } catch (error) {
    console.error("Erreur lors du chargement du flux d'entraide globale :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des entraides." });
  }
};