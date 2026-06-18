import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';
import { ANNONCE_CONFIG, AnnonceType, findAnnonceById } from '../lib/annonces';
import { SousTypeBonPlan } from '@prisma/client'; 
import fs from 'fs';
import path from 'path';
import { verifierContenuAvecIA } from '../services/moderation.service';
import { uploadImageToBlob, deleteImageFromBlob } from '../services/storage.service';


const TYPES: AnnonceType[] = ['EXERCICE', 'BON_PLAN', 'TUTORAT', 'PROJET'];

// GET /recherche : recherche à tags
// Filtres (query) : type, matiere, annee, auteur, has(image|lien), avant, apres, q (texte libre)
// Exemple : /api/annonces/recherche?type=exercice&matiere=Algo&annee=L1&q=récursivité
export async function recherche(req: Request, res: Response): Promise<void> {
  try {
    const { type, matiere, annee, auteur, has, date, avant, apres, q } = req.query as Record<
      string,
      string | undefined
    >;

    // Filtres communs à tous les types d'annonce
    const base: any = {};
    if (auteur) {
      base.utilisateur = {
        OR: [
          { nom: { contains: auteur, mode: 'insensitive' } },
          { prenom: { contains: auteur, mode: 'insensitive' } },
        ],
      };
    }
    if (has === 'image') base.image = { not: null };
    if (has === 'lien') base.lien = { not: null };
    if (date) {
      // Jour précis : du début du jour au début du lendemain
      const debut = new Date(date);
      const lendemain = new Date(debut);
      lendemain.setDate(lendemain.getDate() + 1);
      base.datePublication = { gte: debut, lt: lendemain };
    } else if (avant || apres) {
      base.datePublication = {};
      if (apres) base.datePublication.gte = new Date(apres);
      if (avant) base.datePublication.lte = new Date(avant);
    }

    const typeMap: Record<string, AnnonceType> = {
      exercice: 'EXERCICE',
      bonplan: 'BON_PLAN',
      tutorat: 'TUTORAT',
      projet: 'PROJET',
    };
    const typeKey = type ? typeMap[type.toLowerCase()] : undefined;
    // matiere & annee n'existent que sur Exercice et Tutorat
    const filtreMatiereOuAnnee = !!(matiere || annee);

    // where pour les tables qui ont matiere/annee (Exercice, Tutorat)
    const whereMat: any = { ...base };
    if (annee) whereMat.annee = annee;
    if (matiere) whereMat.matiere = { titre: { contains: matiere, mode: 'insensitive' } };
    if (q) whereMat.description = { contains: q, mode: 'insensitive' };

    // where pour les tables qui ont un titre (BonPlan, Projet)
    const whereTitre: any = { ...base };
    if (q) {
      whereTitre.OR = [
        { titre: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const auteurSelect = { select: { id: true, nom: true, prenom: true, photoProfil: true } };
    const incMat = { utilisateur: auteurSelect, matiere: true };
    const inc = { utilisateur: auteurSelect };

    const tasks: Promise<any[]>[] = [];
    if (!typeKey || typeKey === 'EXERCICE')
      tasks.push(prisma.annonceExercice.findMany({ where: whereMat, include: incMat }));
    if (!typeKey || typeKey === 'TUTORAT')
      tasks.push(prisma.annonceTutorat.findMany({ where: whereMat, include: incMat }));
    if ((!typeKey || typeKey === 'BON_PLAN') && !filtreMatiereOuAnnee)
      tasks.push(prisma.annonceBonPlan.findMany({ where: whereTitre, include: inc }));
    if ((!typeKey || typeKey === 'PROJET') && !filtreMatiereOuAnnee)
      tasks.push(prisma.annonceProjet.findMany({ where: whereTitre, include: inc }));

    const resultats = (await Promise.all(tasks)).flat();
    resultats.sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());

    res.json(toJSON(resultats));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET / : liste toutes les annonces (les 4 types fusionnés, plus récentes d'abord)
/*export async function lister(req: Request, res: Response): Promise<void> {
  try {
    // On regarde si l'utilisateur est connecté
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;

    let excludedUserIds: bigint[] = [];
    let allowedVisibilities: string[] = ['PUBLIQUE'];
    let userFormationId: bigint | null = null;
    let allowedAuthorNiveaux: string[] = [];
    let preferences: string[] = [];

    // ---------------------------------------------------------------------
    // 1. ANCHOR : ANALYSE DU CONTEXTE UTILISATEUR COMPLÈT
    // ---------------------------------------------------------------------
    if (idConnected) {
      // A. Récupération des blocages réciproques (Tranchée Sanitaire)
      const blocages = await prisma.blocage.findMany({
        where: {
          OR: [
            { id_utilisateur_bloquant: idConnected },
            { id_utilisateur_bloque: idConnected }
          ]
        },
        select: { id_utilisateur_bloquant: true, id_utilisateur_bloque: true }
      });

      // Extraire tous les IDs uniques à bannir du flux
      const excludedSet = new Set<bigint>();
      blocages.forEach(b => {
        if (b.id_utilisateur_bloquant !== idConnected) excludedSet.add(b.id_utilisateur_bloquant);
        if (b.id_utilisateur_bloque !== idConnected) excludedSet.add(b.id_utilisateur_bloque);
      });
      excludedUserIds = Array.from(excludedSet);

      // B. Récupération du profil du lecteur pour calculer ses droits de visibilité
      const infoUtilisateur = await prisma.utilisateur.findUnique({
        where: { id: idConnected },
        include: { formation: true }
      });

      if (infoUtilisateur) {
        preferences = infoUtilisateur.centresInteret || [];
        userFormationId = infoUtilisateur.id_formation;

        // Filtre Statique : Autoriser la visibilité liée à son rôle (ETUDIANT / PROFESSEUR)
        allowedVisibilities.push(infoUtilisateur.role);

        // Filtre Relationnel : Calcul des niveaux pour PROMO_SUPERIEUR
        if (infoUtilisateur.formation) {
          const currentNiveau = infoUtilisateur.formation.niveau;
          const currentRank = ENTRAIDE_LEVEL_RANKS[currentNiveau] || 0;

          // Un lecteur de rang X peut voir les posts PROMO_SUPERIEUR des auteurs de rang <= X
          allowedAuthorNiveaux = Object.keys(ENTRAIDE_LEVEL_RANKS).filter(
            niv => ENTRAIDE_LEVEL_RANKS[niv] <= currentRank
          );
        }
      }
    }

    // ---------------------------------------------------------------------
    // 2. ANCHOR : CONSTRUCTION DE LA CLAUSE WHERE DE VISIBILITÉ GÉNÉRIQUE
    // ---------------------------------------------------------------------
    const baseVisibilityWhere = {
      // Règle 1 : L'auteur ne doit pas faire partie des profils bloqués/bloquants
      id_utilisateur: { notIn: excludedUserIds },
      
      // Règle 2 : Algorithme des droits d'accès
      OR: [
        // Option A : C'est mon propre post (je le vois toujours)
        ...(idConnected ? [{ id_utilisateur: idConnected }] : []),
        
        // Option B : Visibilités générales (PUBLIQUE, ou mon rôle exact)
        { visibilite: { in: allowedVisibilities as any } },
        
        // Option C : Visibilité PROMOTION (Même ID de formation)
        ...(userFormationId ? [{
          AND: [
            { visibilite: 'PROMOTION' as const },
            { utilisateur: { id_formation: userFormationId } }
          ]
        }] : []),
        
        // Option D : Visibilité PROMO_SUPERIEUR (L'auteur est d'un niveau inférieur ou égal)
        ...(allowedAuthorNiveaux.length > 0 ? [{
          AND: [
            { visibilite: 'PROMO_SUPERIEUR' as const },
            { utilisateur: { formation: { niveau: { in: allowedAuthorNiveaux } } } }
          ]
        }] : [])
      ]
    };

    // ✨ AJOUT : On inclut les relations jaimes et commentaires pour calculer l'état réel
    const [exercices, bonsPlans, tutorats, projets] = await Promise.all([
      prisma.annonceExercice.findMany({ 
        where: condition, 
        include: { utilisateur: true, matiere: true, jaimes: true, commentaires: true } 
      }), 
      prisma.annonceBonPlan.findMany({ 
        where: condition, 
        include: { utilisateur: true, jaimes: true, commentaires: true } 
      }),
      prisma.annonceTutorat.findMany({ 
        where: condition, 
        include: { utilisateur: true, matiere: true, jaimes: true, commentaires: true } 
      }), 
      prisma.annonceProjet.findMany({ 
        where: condition, 
        include: { utilisateur: true, jaimes: true, commentaires: true } 
      }),
    ]);

    let toutesRaw = [...exercices, ...bonsPlans, ...tutorats, ...projets];

    // 3. Filtrer en fonction des préférences de l'utilisateur (si définies)
    if (preferences.length > 0) {
      toutesRaw = toutesRaw.filter(annonce => {
        if (annonce.type === 'PROJET' && preferences.includes('PROJET')) return true;
        if (annonce.type === 'EXERCICE' && preferences.includes('EXERCICE')) return true;
        if (annonce.type === 'BON_PLAN' && preferences.includes('BON_PLAN')) return true;
        if (annonce.type === 'TUTORAT' && (preferences.includes('ENTRAIDE') || preferences.includes('MATIERE'))) return true;
        return false;
      });
    }

    // ✨ AJOUT : On mappe les annonces pour injecter 'isLikedByMe' et 'nbCommentaires' requis par le Front
    const toutes = toutesRaw.map((annonce: any) => {
      const jaimesArray = annonce.jaimes || [];
      const commentairesArray = annonce.commentaires || [];
      
      return {
        ...annonce,
        // On calcule si l'utilisateur connecté a aimé l'annonce
        isLikedByMe: idConnected 
          ? jaimesArray.some((j: any) => j.id_utilisateur === idConnected) 
          : false,
        // On renvoie la longueur exacte du tableau des commentaires
        nbCommentaires: commentairesArray.length
      };
    });

    // Tri par date décroissante
    toutes.sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());

    if (!hasPrefs || preferences.includes('PROJET')) {
      activeQueries.push(prisma.annonceProjet.findMany({
        where: baseVisibilityWhere,
        include: { utilisateur: safeUserInclude },
        orderBy: { datePublication: 'desc' },
        take: 25
      }));
    }

    if (!hasPrefs || preferences.includes('ENTRAIDE') || preferences.includes('MATIERE')) {
      activeQueries.push(prisma.annonceTutorat.findMany({
        where: baseVisibilityWhere,
        include: { utilisateur: safeUserInclude, matiere: true },
        orderBy: { datePublication: 'desc' },
        take: 25
      }));
    }

    // Lancement simultané des requêtes requises uniquement
    const queryResults = await Promise.all(activeQueries);
    const toutesLesAnnonces = queryResults.flat();

    // ---------------------------------------------------------------------
    // 4. ANCHOR : TRI DE FUSION FINAL & SÉRIALISATION DES BIGINT
    // ---------------------------------------------------------------------
    // Tri chronologique global (du plus récent au plus ancien)
    toutesLesAnnonces.sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());

    // Fonction récursive pour transformer tous les BigInt du payload en String (Évite le crash JSON)
    const deepSerializeBigInt = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
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

    res.status(200).json(deepSerializeBigInt(toutesLesAnnonces));

  } catch (error) {
    console.error("❌ Erreur critique dans le contrôleur de flux :", error);
    res.status(500).json({ message: "Erreur serveur lors de la génération du fil d'actualité." });
  }
}*/

// GET / : liste toutes les annonces (les 4 types fusionnés, plus récentes d'abord)
// À placer juste au-dessus de la fonction lister
const LEVEL_RANKS: Record<string, number> = {
  'L1': 1, 'L2': 2, 'L3': 3, 'M1': 4, 'M2': 5,
  '1A': 1, '2A': 2, '3A': 3, '4A': 4, '5A': 5 // Support complet pour les deux nomenclatures
};

export async function lister(req: Request, res: Response): Promise<void> {
  try {
    // On regarde si l'utilisateur est connecté
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;
    const idConnectedStr = req.utilisateur ? String(req.utilisateur.id) : null;
    
    let excludedUserIds: bigint[] = [];
    let allowedVisibilities: string[] = ['PUBLIQUE'];
    let userFormationId: bigint | null = null;
    let allowedAuthorNiveaux: string[] = [];
    let preferences: string[] = [];
    let isAdminUser = false; // ✨ Drapeau pour savoir si c'est un admin

    // 1. Extraction des règles de sécurité et visibilité
    if (idConnected) {
      // Gestion des blocages dans les deux sens
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

      // Récupération des informations académiques et des préférences de l'utilisateur
      const infoUtilisateur = await prisma.utilisateur.findUnique({
        where: { id: idConnected },
        include: { formation: true }
      });

      if (infoUtilisateur) {
        userFormationId = infoUtilisateur.id_formation;
        preferences = infoUtilisateur.centresInteret || [];
        
        // ✨ Sécurité : On vérifie si c'est un admin
        if (infoUtilisateur.role === 'ADMIN') {
          isAdminUser = true;
        } else if (infoUtilisateur.role) {
          // On n'ajoute le rôle aux visibilités QUE si ce n'est pas un admin (évite le crash Prisma)
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

    // 2. Création de la condition de filtrage de visibilité globale
    const condition: any = {
      id_utilisateur: { notIn: excludedUserIds }, // Exclure les personnes bloquées
    };

    // ✨ Si l'utilisateur est ADMIN, on ne met aucun filtre OR de visibilité : il voit TOUT !
    if (!isAdminUser) {
      condition.OR = [
        ...(idConnected ? [{ id_utilisateur: idConnected }] : []), // Un auteur voit ses propres annonces
        { visibilite: { in: allowedVisibilities as any } }, // Publique ou correspondant à son rôle
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

    // 3. Récupération en parallèle sur les 4 tables avec la condition adaptée
    const [exercices, bonsPlans, tutorats, projets] = await Promise.all([
      prisma.annonceExercice.findMany({ 
        where: condition, 
        include: { utilisateur: true, matiere: true, jaimes: true, commentaires: true } 
      }), 
      prisma.annonceBonPlan.findMany({ 
        where: condition, 
        include: { utilisateur: true, jaimes: true, commentaires: true } 
      }),
      prisma.annonceTutorat.findMany({ 
        where: condition, 
        include: { utilisateur: true, matiere: true, jaimes: true, commentaires: true } 
      }), 
      prisma.annonceProjet.findMany({ 
        where: condition, 
        include: { utilisateur: true, jaimes: true, commentaires: true } 
      }),
    ]);

    let toutesRaw = [...exercices, ...bonsPlans, ...tutorats, ...projets];

    // 4. Mapping requis pour injecter l'état réel des interactions
    const toutes = toutesRaw.map((annonce: any) => {
      const jaimesArray = annonce.jaimes || [];
      const commentairesArray = annonce.commentaires || [];
      
      const isLikedByMe = idConnectedStr 
        ? jaimesArray.some((j: any) => String(j.id_utilisateur) === idConnectedStr) 
        : false;

      return {
        ...annonce,
        isLikedByMe,
        nbCommentaires: commentairesArray.length
      };
    });

    // 5. Tri par priorité de préférences, puis par date décroissante
    toutes.sort((a, b) => {
      const aMatchesPref = preferences.length > 0 && (
        (a.type === 'PROJET' && preferences.includes('PROJET')) ||
        (a.type === 'EXERCICE' && preferences.includes('EXERCICE')) ||
        (a.type === 'BON_PLAN' && preferences.includes('BON_PLAN')) ||
        (a.type === 'TUTORAT' && (preferences.includes('ENTRAIDE') || preferences.includes('MATIERE')))
      );

      const bMatchesPref = preferences.length > 0 && (
        (b.type === 'PROJET' && preferences.includes('PROJET')) ||
        (b.type === 'EXERCICE' && preferences.includes('EXERCICE')) ||
        (b.type === 'BON_PLAN' && preferences.includes('BON_PLAN')) ||
        (b.type === 'TUTORAT' && (preferences.includes('ENTRAIDE') || preferences.includes('MATIERE')))
      );

      if (aMatchesPref && !bMatchesPref) return -1;
      if (!aMatchesPref && bMatchesPref) return 1;

      return b.datePublication.getTime() - a.datePublication.getTime();
    });

    res.json(toJSON(toutes));
  } catch (err) {
    console.error("Erreur dans lister avec gestion de visibilité :", err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des annonces.' });
  }
}

// GET /mes : annonces de l'utilisateur connecté
export async function mesAnnonces(req: Request, res: Response): Promise<void> {
  try {
    const where = { id_utilisateur: BigInt(req.utilisateur!.id) };
    const [exercices, bonsPlans, tutorats, projets] = await Promise.all([
      prisma.annonceExercice.findMany({ where }),
      prisma.annonceBonPlan.findMany({ where }),
      prisma.annonceTutorat.findMany({ where }),
      prisma.annonceProjet.findMany({ where }),
    ]);

    const toutes = [...exercices, ...bonsPlans, ...tutorats, ...projets].sort(
      (a, b) => b.datePublication.getTime() - a.datePublication.getTime()
    );

    res.json(toJSON(toutes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /:id : détail d'une annonce (param ?type= optionnel pour lever l'ambiguïté)
export async function detail(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as AnnonceType | undefined;
    const found = await findAnnonceById(BigInt(req.params.id), type);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }
    // On recharge avec l'auteur (+ matière pour Exercice/Tutorat) pour l'affichage de la carte
    const include: any = { utilisateur: { select: { id: true, nom: true, prenom: true, photoProfil: true } } };
    if (found.type === 'EXERCICE' || found.type === 'TUTORAT') include.matiere = true;
    const record = await ANNONCE_CONFIG[found.type].delegate.findUnique({
      where: { id: found.record.id },
      include,
    });
    res.json(toJSON(record));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}


// Fonction utilitaire pour sérialiser
const serializeAnnonce = (annonce: any) => {
    return {
        ...annonce,
        id: annonce.id.toString(),
        id_utilisateur: annonce.id_utilisateur.toString(),
        id_matiere: annonce.id_matiere ? annonce.id_matiere.toString() : undefined,
    };
};



// POST /api/annonces/exercice
export async function createExercice(req: Request, res: Response): Promise<void> {
    try {
        const id_utilisateur = BigInt(req.utilisateur!.id);
        const { annee, id_matiere, description, visibilite } = req.body;
        const lien = req.body.lien || null;

        if (!description || !annee || !id_matiere) {
            res.status(400).json({ message: 'Champs requis manquants : description, annee, id_matiere' });
            return;
        }

        // Upload image vers Blob si présente
        let imageUrl: string | null = null;
        if (req.file) {
            imageUrl = await uploadImageToBlob(req.file);
        }

        const verdict = await verifierContenuAvecIA(description, undefined, lien, imageUrl ? [imageUrl] : []);

        if (verdict === 'REJECT') {
            if (imageUrl) await deleteImageFromBlob(imageUrl); // Nettoyage Blob
            res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
            return;
        }

        const annonce = await prisma.annonceExercice.create({
            data: { description, annee, visibilite, id_matiere: BigInt(id_matiere), id_utilisateur, image: imageUrl, lien },
        });

        res.status(201).json(toJSON(annonce));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}


// POST /api/annonces/bonplan
export async function createBonPlan(req: Request, res: Response): Promise<void> {
    try {
        const id_utilisateur = BigInt(req.utilisateur!.id);
        const { titre, description, sousType, visibilite } = req.body;
        const lien = req.body.lien || null;
        const image = req.file ? req.file.filename : null;

        const sousTypesAutorises = Object.values(SousTypeBonPlan);

        if (!titre || !description || !sousType) {
            res.status(400).json({ message: 'Champs requis manquants : titre, description, sousType' });
            return;
        }
        if (!sousTypesAutorises.includes(sousType)) {
            res.status(400).json({ message: `sousType invalide. Valeurs autorisées : ${sousTypesAutorises.join(', ')}` });
            return;
        }
         // Upload image vers Blob si présente
        let imageUrl: string | null = null;
        if (req.file) {
            imageUrl = await uploadImageToBlob(req.file);
        }
        
        const verdict = await verifierContenuAvecIA(description, titre, lien, imageUrl ? [imageUrl] : []);

        if (verdict === 'REJECT') {
            if (imageUrl) {
                await deleteImageFromBlob(imageUrl);
            }
            res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
            return;
        }

        const annonce = await prisma.annonceBonPlan.create({
            data: { titre, description, visibilite, sousType, id_utilisateur, image, lien },
        });

        res.status(201).json(toJSON(annonce));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// POST /api/annonces/tutorat
export async function createTutorat(req: Request, res: Response): Promise<void> {
    try {
        const id_utilisateur = BigInt(req.utilisateur!.id);
        const { description, annee, id_matiere, nbCandidatsVoulus, visibilite } = req.body;
        const lien = req.body.lien || null;
        const image = req.file ? req.file.filename : null;

        if (!description || !annee || !id_matiere || nbCandidatsVoulus === undefined) {
            res.status(400).json({ message: 'Champs requis manquants : description, annee, id_matiere, nbCandidatsVoulus' });
            return;
        }

        const nb = Number(nbCandidatsVoulus);
        if (!Number.isInteger(nb) || nb < 1) {
            res.status(400).json({ message: 'nbCandidatsVoulus doit être un entier >= 1' });
            return;
        }

         // Upload image vers Blob si présente
        let imageUrl: string | null = null;
        if (req.file) {
            imageUrl = await uploadImageToBlob(req.file);
        }

        const verdict = await verifierContenuAvecIA(description, undefined, lien, imageUrl ? [imageUrl] : []);

        if (verdict === 'REJECT') {
            if (imageUrl) {
                await deleteImageFromBlob(imageUrl);
            }
            res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
            return;
        }

        const annonce = await prisma.annonceTutorat.create({
            data: { description, annee, visibilite, id_matiere: BigInt(id_matiere), nbCandidatsVoulus: nb, id_utilisateur, image, lien },
        });

        res.status(201).json(toJSON(annonce));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// POST /api/annonces/projet
export async function createProjet(req: Request, res: Response): Promise<void> {
    try {
        const id_utilisateur = BigInt(req.utilisateur!.id);
        const { titre, description, visibilite } = req.body;
        const lien = req.body.lien || null;
        const image = req.file ? req.file.filename : null;

        if (!titre || !description) {
            res.status(400).json({ message: 'Champs requis manquants : titre, description' });
            return;
        }

        let imageUrl: string | null = null;
        if (req.file) {
            imageUrl = await uploadImageToBlob(req.file);
        }

        const verdict = await verifierContenuAvecIA(description, titre, lien, imageUrl ? [imageUrl] : []);

        if (verdict === 'REJECT') {
            if (imageUrl) {
                await deleteImageFromBlob(imageUrl);
            }
            res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
            return;
        }

        const annonce = await prisma.annonceProjet.create({
            data: { titre, description, visibilite, id_utilisateur, image: imageUrl, lien },
        });

        res.status(201).json(toJSON(annonce));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// PUT /api/annonces/:type/:id
export async function modifierAnnonce(req: Request, res: Response): Promise<void> {
    try {
        const { type, id } = req.params;

        if (isNaN(Number(id))) {
            res.status(400).json({ message: "L'ID fourni est invalide." });
            return;
        }

        const idAnnonce = BigInt(id);
        const idUtilisateur = BigInt(req.utilisateur!.id);

        let annonceExistante: any;
        switch (type.toLowerCase()) {
            case 'exercice': annonceExistante = await prisma.annonceExercice.findUnique({ where: { id: idAnnonce } }); break;
            case 'bonplan':  annonceExistante = await prisma.annonceBonPlan.findUnique({ where: { id: idAnnonce } }); break;
            case 'tutorat':  annonceExistante = await prisma.annonceTutorat.findUnique({ where: { id: idAnnonce } }); break;
            case 'projet':   annonceExistante = await prisma.annonceProjet.findUnique({ where: { id: idAnnonce } }); break;
            default: { res.status(400).json({ message: "Type d'annonce inconnu." }); return; }
        }

        if (!annonceExistante) { res.status(404).json({ message: "Annonce introuvable." }); return; }
        if (annonceExistante.id_utilisateur !== idUtilisateur) {
            res.status(403).json({ message: "Action non autorisée." });
            return;
        }

        const data: any = {};
        if (req.body.description !== undefined) data.description = req.body.description;
        if (req.body.lien !== undefined) data.lien = req.body.lien;
        if (req.body.visibilite !== undefined) data.visibilite = req.body.visibilite;

        // ✅ Upload nouvelle image vers Blob si présente
        let nouvelleImageUrl: string | null = null;
        if (req.file) {
            nouvelleImageUrl = await uploadImageToBlob(req.file);
            data.image = nouvelleImageUrl;

            // ✅ Supprimer l'ancienne image du Blob si elle existait
            if (annonceExistante.image) {
                await deleteImageFromBlob(annonceExistante.image);
            }
        }

        if (type === 'exercice' || type === 'tutorat') {
            if (req.body.annee) data.annee = req.body.annee;
            if (req.body.id_matiere) data.id_matiere = BigInt(req.body.id_matiere);
        }
        if (type === 'tutorat' && req.body.nbCandidatsVoulus) data.nbCandidatsVoulus = Number(req.body.nbCandidatsVoulus);
        if (type === 'bonplan' || type === 'projet') if (req.body.titre) data.titre = req.body.titre;
        if (type === 'bonplan' && req.body.sousType) data.sousType = req.body.sousType;

        // ✅ Modération avec l'URL Blob (pas un nom de fichier)
        const verdict = await verifierContenuAvecIA(
            data.description,
            data.titre,
            data.lien,
            nouvelleImageUrl ? [nouvelleImageUrl] : []
        );

        if (verdict === 'REJECT') {
            // ✅ Supprimer la nouvelle image du Blob si rejetée
            if (nouvelleImageUrl) await deleteImageFromBlob(nouvelleImageUrl);
            res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
            return;
        }

        let annonceMiseAJour: any;
        switch (type.toLowerCase()) {
            case 'exercice': annonceMiseAJour = await prisma.annonceExercice.update({ where: { id: idAnnonce }, data }); break;
            case 'bonplan':  annonceMiseAJour = await prisma.annonceBonPlan.update({ where: { id: idAnnonce }, data }); break;
            case 'tutorat':  annonceMiseAJour = await prisma.annonceTutorat.update({ where: { id: idAnnonce }, data }); break;
            case 'projet':   annonceMiseAJour = await prisma.annonceProjet.update({ where: { id: idAnnonce }, data }); break;
        }

        res.status(200).json(serializeAnnonce(annonceMiseAJour));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur lors de la modification." });
    }
} 
//---------------------------------------------------------------------
// DELETE /api/annonces/:type/:id
//---------------------------------------------------------------------
export async function supprimerAnnonce(req: Request, res: Response): Promise<void> {
    try {
        const { type, id } = req.params;

        if (isNaN(Number(id))) {
            res.status(400).json({ message: "L'ID fourni est invalide." });
            return;
        }

        const idAnnonce = BigInt(id);
        const idUtilisateur = BigInt(req.utilisateur!.id);

        let annonce: any;
        let actionSuppression: () => Promise<any>;

        switch (type.toLowerCase()) {
            case 'exercice':
                annonce = await prisma.annonceExercice.findUnique({ where: { id: idAnnonce } });
                actionSuppression = () => prisma.annonceExercice.delete({ where: { id: idAnnonce } });
                break;
            case 'bonplan':
                annonce = await prisma.annonceBonPlan.findUnique({ where: { id: idAnnonce } });
                actionSuppression = () => prisma.annonceBonPlan.delete({ where: { id: idAnnonce } });
                break;
            case 'tutorat':
                annonce = await prisma.annonceTutorat.findUnique({ where: { id: idAnnonce } });
                actionSuppression = () => prisma.annonceTutorat.delete({ where: { id: idAnnonce } });
                break;
            case 'projet':
                annonce = await prisma.annonceProjet.findUnique({ where: { id: idAnnonce } });
                actionSuppression = () => prisma.annonceProjet.delete({ where: { id: idAnnonce } });
                break;
            default:
                res.status(400).json({ message: "Type d'annonce inconnu." });
                return;
        }

        if (!annonce) {
            res.status(404).json({ message: "Annonce introuvable." });
            return;
        }

        if (annonce.id_utilisateur !== idUtilisateur) {
            res.status(403).json({ message: "Action non autorisée. Vous n'êtes pas l'auteur de cette publication." });
            return;
        }

        // Supprimer l'image du Blob Azure si elle existe
        if (annonce.image) {
            await deleteImageFromBlob(annonce.image);
        }

        await actionSuppression();
        res.status(200).json({ message: "Publication supprimée avec succès." });

    } catch (error) {
        console.error("Erreur lors de la suppression de l'annonce :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression." });
    }
}


export async function toggleLike(req: Request, res: Response): Promise<void> {
  try {
    const { type, id } = req.params;

    if (isNaN(Number(id))) {
      res.status(400).json({ message: "L'ID fourni est invalide." });
      return;
    }

    const idAnnonce = BigInt(id);
    const idUtilisateur = BigInt(req.utilisateur!.id);

    let champIdType: string;
    let modelAnnonce: any;

    switch (type.toLowerCase()) {
      case 'exercice': champIdType = 'id_exercice'; modelAnnonce = prisma.annonceExercice; break;
      case 'bonplan':  champIdType = 'id_bonplan';  modelAnnonce = prisma.annonceBonPlan;  break;
      case 'tutorat':  champIdType = 'id_tutorat';  modelAnnonce = prisma.annonceTutorat;  break;
      case 'projet':   champIdType = 'id_projet';   modelAnnonce = prisma.annonceProjet;   break;
      default: 
        res.status(400).json({ message: "Type d'annonce inconnu." });
        return;
    }

    const annonce = await modelAnnonce.findUnique({ where: { id: idAnnonce } });
    if (!annonce) {
      res.status(404).json({ message: "Annonce introuvable." });
      return;
    }

    const likeExistant = await prisma.jaime.findFirst({
      where: { id_utilisateur: idUtilisateur, [champIdType]: idAnnonce },
    });

    if (likeExistant) {
      await prisma.$transaction([
        prisma.jaime.delete({ where: { id: likeExistant.id } }),
        modelAnnonce.update({ where: { id: idAnnonce }, data: { nbJaime: { decrement: 1 } } }),
      ]);
      res.status(200).json({ message: "Like retiré.", liked: false });
    } else {
      await prisma.$transaction([
        prisma.jaime.create({ data: { id_utilisateur: idUtilisateur, [champIdType]: idAnnonce } }),
        modelAnnonce.update({ where: { id: idAnnonce }, data: { nbJaime: { increment: 1 } } }),
      ]);
      res.status(200).json({ message: "Annonce likée.", liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors du toggle du like." });
  }
}