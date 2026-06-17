import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';
import { ANNONCE_CONFIG, AnnonceType, findAnnonceById } from '../lib/annonces';
import { SousTypeBonPlan } from '@prisma/client'; 
import fs from 'fs';
import path from 'path';
import { verifierContenuAvecIA } from '../services/moderation.service';

const TYPES: AnnonceType[] = ['EXERCICE', 'BON_PLAN', 'TUTORAT', 'PROJET'];

// Configuration de la hiérarchie des niveaux pour la visibilité PROMO_SUPERIEUR
const ENTRAIDE_LEVEL_RANKS: Record<string, number> = {
  '1A': 1,
  '2A': 2,
  '3A': 3,
  '4A': 4,
  '5A': 5
};

export async function lister(req: Request, res: Response): Promise<void> {
  try {
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

    // ---------------------------------------------------------------------
    // 3. ANCHOR : EXÉCUTION CIBLÉE DES REQUÊTES (Filtre au niveau de la BDD)
    // ---------------------------------------------------------------------
    const activeQueries: Promise<any[]>[] = [];
    const hasPrefs = preferences.length > 0;

    // Définition de la sélection sécurisée de l'utilisateur (on cache le mot de passe !)
    const safeUserInclude = {
      select: { id: true, nom: true, prenom: true, photoProfil: true, role: true }
    };

    // On n'ajoute la promesse que si la catégorie matche avec les préférences de l'utilisateur
    if (!hasPrefs || preferences.includes('EXERCICE')) {
      activeQueries.push(prisma.annonceExercice.findMany({
        where: baseVisibilityWhere,
        include: { utilisateur: safeUserInclude, matiere: true },
        orderBy: { datePublication: 'desc' },
        take: 25
      }));
    }

    if (!hasPrefs || preferences.includes('BON_PLAN')) {
      activeQueries.push(prisma.annonceBonPlan.findMany({
        where: baseVisibilityWhere,
        include: { utilisateur: safeUserInclude },
        orderBy: { datePublication: 'desc' },
        take: 25
      }));
    }

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
    res.json(toJSON(found.record));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST / : crée une annonce selon le `type` envoyé dans le body
export async function creer(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.body;
    if (!TYPES.includes(type)) {
      res.status(400).json({ message: 'type invalide (EXERCICE, BON_PLAN, TUTORAT ou PROJET)' });
      return;
    }

    const id_utilisateur = BigInt(req.utilisateur!.id);
    const image = req.file ? req.file.filename : null;
    const lien = req.body.lien ?? null;
    const b = req.body;
    let annonce;

    switch (type as AnnonceType) {
      case 'EXERCICE':
        annonce = await prisma.annonceExercice.create({
          data: { annee: b.annee, description: b.description, id_matiere: BigInt(b.id_matiere), id_utilisateur, image, lien },
        });
        break;
      case 'BON_PLAN':
        annonce = await prisma.annonceBonPlan.create({
          data: { titre: b.titre, description: b.description, sousType: b.sousType, id_utilisateur, image, lien },
        });
        break;
      case 'TUTORAT':
        annonce = await prisma.annonceTutorat.create({
          data: {
            nbCandidatsVoulus: Number(b.nbCandidatsVoulus),
            annee: b.annee,
            description: b.description,
            id_matiere: BigInt(b.id_matiere),
            id_utilisateur,
            image,
            lien,
          },
        });
        break;
      case 'PROJET':
        annonce = await prisma.annonceProjet.create({
          data: { titre: b.titre, description: b.description, id_utilisateur, image, lien },
        });
        break;
    }

    res.status(201).json(toJSON(annonce));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// PUT /:id : modifie une annonce (l'auteur uniquement)
export async function modifier(req: Request, res: Response): Promise<void> {
  try {
    const type = (req.body.type ?? req.query.type) as AnnonceType | undefined;
    const found = await findAnnonceById(BigInt(req.params.id), type);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }
    if (found.record.id_utilisateur.toString() !== req.utilisateur!.id) {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    // On ne met à jour que les champs fournis et autorisés
    const data: Record<string, unknown> = {};
    for (const champ of ['titre', 'description', 'annee', 'lien', 'sousType']) {
      if (req.body[champ] !== undefined) data[champ] = req.body[champ];
    }
    if (req.body.nbCandidatsVoulus !== undefined) data.nbCandidatsVoulus = Number(req.body.nbCandidatsVoulus);
    if (req.file) data.image = req.file.filename;

    const annonce = await ANNONCE_CONFIG[found.type].delegate.update({
      where: { id: found.record.id },
      data,
    });

    res.json(toJSON(annonce));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// DELETE /:id : supprime une annonce (l'auteur uniquement)
export async function supprimer(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as AnnonceType | undefined;
    const found = await findAnnonceById(BigInt(req.params.id), type);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }
    if (found.record.id_utilisateur.toString() !== req.utilisateur!.id) {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    await ANNONCE_CONFIG[found.type].delegate.delete({ where: { id: found.record.id } });
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// ---------------------------------------------------------------------
// POST /api/annonces/exercice
// ---------------------------------------------------------------------
export async function createExercice(req: Request, res: Response): Promise<void> {
  try {
    const id_utilisateur = BigInt(req.utilisateur!.id);
    const { annee, id_matiere, description, visibilite } = req.body;
    const lien = req.body.lien || null;
    const image = req.file ? req.file.filename : null;
 
    if (!description || !annee || !id_matiere) {
      res.status(400).json({ message: 'Champs requis manquants : description, annee, id_matiere' });
      return;
    }

    const verdict = await verifierContenuAvecIA(description, undefined, lien);

    if (verdict === 'REJECT') {
      res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
      return;
    }
 
 
    const annonce = await prisma.annonceExercice.create({
      data: {
        description,
        annee,
        visibilite,
        id_matiere: BigInt(id_matiere),
        id_utilisateur,
        image,
        lien,
      },
    });
 
    res.status(201).json(toJSON(annonce));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
 
// ---------------------------------------------------------------------
// POST /api/annonces/bonplan
// ---------------------------------------------------------------------
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

    // Appel du service de modération automatique
    const verdict = await verifierContenuAvecIA(description, titre, lien);

    if (verdict === 'REJECT') {
      res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
      return;
    }
 
    const annonce = await prisma.annonceBonPlan.create({
      data: {
        titre,
        description,
        visibilite,
        sousType,
        id_utilisateur,
        image,
        lien,
      },
    });
 
    res.status(201).json(toJSON(annonce));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
 
// ---------------------------------------------------------------------
// POST /api/annonces/tutorat
// ---------------------------------------------------------------------
export async function createTutorat(req: Request, res: Response): Promise<void> {
  try {
    const id_utilisateur = BigInt(req.utilisateur!.id);
    const { description, annee, id_matiere, nbCandidatsVoulus, visibilite } = req.body;
    const lien = req.body.lien || null;
    const image = req.file ? req.file.filename : null;
 
    if (!description || !annee || !id_matiere || nbCandidatsVoulus === undefined) {
      res.status(400).json({
        message: 'Champs requis manquants : description, annee, id_matiere, nbCandidatsVoulus',
      });
      return;
    }

    // Appel du service de modération automatique
    const verdict = await verifierContenuAvecIA(description, undefined, lien);

    if (verdict === 'REJECT') {
      res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
      return;
    }
 
    const nb = Number(nbCandidatsVoulus);
    if (!Number.isInteger(nb) || nb < 1) {
      res.status(400).json({ message: 'nbCandidatsVoulus doit être un entier >= 1' });
      return;
    }
 
    const annonce = await prisma.annonceTutorat.create({
      data: {
        description,
        annee,
        visibilite,
        id_matiere: BigInt(id_matiere),
        nbCandidatsVoulus: nb,
        id_utilisateur,
        image,
        lien,
      },
    });
 
    res.status(201).json(toJSON(annonce));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
 
// ---------------------------------------------------------------------
// POST /api/annonces/projet
// ---------------------------------------------------------------------
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

    // Appel du service de modération automatique
    const verdict = await verifierContenuAvecIA(description, titre, lien);

    if (verdict === 'REJECT') {
      res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
      return;
    }
 
    const annonce = await prisma.annonceProjet.create({
      data: {
        titre,
        description,
        visibilite,
        id_utilisateur,
        image,
        lien,
      },
    });
 
    res.status(201).json(toJSON(annonce));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
 
//---------------------------------------------------------------------
// DELETE /api/annonces/:type/:id : supprime une annonce selon son type (l'auteur uniquement)
//---------------------------------------------------------------------


export async function supprimerAnnonce(req: Request, res: Response): Promise<void> {
  try {
    const { type, id } = req.params;
    
    // Vérification de sécurité pour éviter que BigInt() ne plante sur des lettres
    if (isNaN(Number(id))) {
      res.status(400).json({ message: "L'ID fourni est invalide." });
      return;
    }

    const idAnnonce = BigInt(id);
    const idUtilisateur = BigInt(req.utilisateur!.id); // On suppose que auth peuple req.utilisateur

    let annonce;
    let actionSuppression;

    // 1. Déterminer la cible selon le paramètre URL (:type)
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

    // 2. Vérifier si l'annonce existe
    if (!annonce) {
      res.status(404).json({ message: "Annonce introuvable." });
      return;
    }

    // 3. Vérifier les permissions (Seul l'auteur peut la supprimer)
    if (annonce.id_utilisateur !== idUtilisateur) {
      res.status(403).json({ message: "Action non autorisée. Vous n'êtes pas l'auteur de cette publication." });
      return;
    }

    // 4. Nettoyage du disque : Supprimer l'image associée si elle existe
    if (annonce.image) {
      const imagePath = path.join(process.cwd(), 'uploads', annonce.image);
      // fs.existsSync vérifie que le fichier est bien là avant d'essayer de le supprimer
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath); // Suppression physique du fichier
        } catch (fileErr) {
          console.error(`Impossible de supprimer l'image physique : ${imagePath}`, fileErr);
          // On ne bloque pas la suppression en BDD si l'image physique a un problème
        }
      }
    }

    // 5. Suppression en base de données
    await actionSuppression();

    res.status(200).json({ message: "Publication supprimée avec succès." });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'annonce :", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
}

// Fonction utilitaire pour éviter la répétition de la conversion BigInt -> String
const serializeAnnonce = (annonce: any) => {
  return {
    ...annonce,
    id: annonce.id.toString(),
    id_utilisateur: annonce.id_utilisateur.toString(),
    id_matiere: annonce.id_matiere ? annonce.id_matiere.toString() : undefined,
  };
};

export async function modifierAnnonce(req: Request, res: Response): Promise<void> {
  try {
    const { type, id } = req.params;
    
    if (isNaN(Number(id))) {
      res.status(400).json({ message: "L'ID fourni est invalide." });
      return;
    }

    const idAnnonce = BigInt(id);
    const idUtilisateur = BigInt(req.utilisateur!.id);

    // 1. Récupérer l'annonce existante pour vérifier les droits et l'ancienne image
    let annonceExistante;
    switch (type.toLowerCase()) {
      case 'exercice': annonceExistante = await prisma.annonceExercice.findUnique({ where: { id: idAnnonce } }); break;
      case 'bonplan':  annonceExistante = await prisma.annonceBonPlan.findUnique({ where: { id: idAnnonce } }); break;
      case 'tutorat':  annonceExistante = await prisma.annonceTutorat.findUnique({ where: { id: idAnnonce } }); break;
      case 'projet':   annonceExistante = await prisma.annonceProjet.findUnique({ where: { id: idAnnonce } }); break;
      default: {
        res.status(400).json({ message: "Type d'annonce inconnu." });
        return;
      }
    }

    if (!annonceExistante) {
      res.status(404).json({ message: "Annonce introuvable." });
      return;
    }

    if (annonceExistante.id_utilisateur !== idUtilisateur) {
      res.status(403).json({ message: "Action non autorisée. Seul l'auteur peut modifier cette publication." });
      return;
    }

    // 2. Construire l'objet de données à mettre à jour dynamiquement
    const data: any = {};

    // Champs communs
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.lien !== undefined) data.lien = req.body.lien;
    if (req.body.visibilite !== undefined) data.visibilite = req.body.visibilite;

    // Gestion de l'image
    if (req.file) {
      data.image = req.file.filename; // Nouvelle image

      // Nettoyage : supprimer l'ancienne image du disque
      if (annonceExistante.image) {
        const oldImagePath = path.join(process.cwd(), 'uploads', annonceExistante.image);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.error("Erreur lors de la suppression de l'ancienne image :", err);
          }
        }
      }
    }

    // Champs spécifiques selon le type
    if (type === 'exercice' || type === 'tutorat') {
      if (req.body.annee) data.annee = req.body.annee;
      if (req.body.id_matiere) data.id_matiere = BigInt(req.body.id_matiere);
    }
    
    if (type === 'tutorat') {
      if (req.body.nbCandidatsVoulus) data.nbCandidatsVoulus = Number(req.body.nbCandidatsVoulus);
    }

    if (type === 'bonplan' || type === 'projet') {
      if (req.body.titre) data.titre = req.body.titre;
    }

    if (type === 'bonplan') {
      if (req.body.sousType) data.sousType = req.body.sousType;
    }

    // Appel du service de modération automatique
    const verdict = await verifierContenuAvecIA(data.description , data.titre, data.lien);

    if (verdict === 'REJECT') {
      res.status(400).json({ message: "Votre annonce a été rejetée par le système de modération." });
      return;
    }

    // 3. Exécuter la mise à jour
    let annonceMiseAJour;
    switch (type.toLowerCase()) {
      case 'exercice': annonceMiseAJour = await prisma.annonceExercice.update({ where: { id: idAnnonce }, data }); break;
      case 'bonplan':  annonceMiseAJour = await prisma.annonceBonPlan.update({ where: { id: idAnnonce }, data }); break;
      case 'tutorat':  annonceMiseAJour = await prisma.annonceTutorat.update({ where: { id: idAnnonce }, data }); break;
      case 'projet':   annonceMiseAJour = await prisma.annonceProjet.update({ where: { id: idAnnonce }, data }); break;
    }

    // 4. Réponse
    res.status(200).json(serializeAnnonce(annonceMiseAJour));

  } catch (error) {
    console.error("Erreur lors de la modification de l'annonce :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification." });
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

    // 1. Mappage dynamique selon le type d'annonce
    let champIdType: string;
    let modelAnnonce: any;

    switch (type.toLowerCase()) {
      case 'exercice': 
        champIdType = 'id_exercice'; 
        modelAnnonce = prisma.annonceExercice; 
        break;
      case 'bonplan':  
        champIdType = 'id_bonplan';  
        modelAnnonce = prisma.annonceBonPlan;  
        break;
      case 'tutorat':  
        champIdType = 'id_tutorat';  
        modelAnnonce = prisma.annonceTutorat;  
        break;
      case 'projet':   
        champIdType = 'id_projet';   
        modelAnnonce = prisma.annonceProjet;   
        break;
      default: 
        res.status(400).json({ message: "Type d'annonce inconnu." });
        return;
    }

    // 2. Vérifier si l'annonce existe
    const annonce = await modelAnnonce.findUnique({ where: { id: idAnnonce } });
    if (!annonce) {
      res.status(404).json({ message: "Annonce introuvable." });
      return;
    }

    // 3. Chercher si le "J'aime" existe déjà pour cet utilisateur et cette annonce
    const likeExistant = await prisma.jaime.findFirst({
      where: {
        id_utilisateur: idUtilisateur,
        [champIdType]: idAnnonce, // Utilisation de la clé dynamique (ex: id_exercice: 12)
      },
    });

    // 4. Utilisation d'une Transaction pour garantir la cohérence des données
    if (likeExistant) {
      // Cas A : Il a déjà aimé -> On retire le like et on décrémente le compteur
      await prisma.$transaction([
        prisma.jaime.delete({ where: { id: likeExistant.id } }),
        modelAnnonce.update({
          where: { id: idAnnonce },
          data: { nbJaime: { decrement: 1 } },
        }),
      ]);
      
      res.status(200).json({ message: "Like retiré.", liked: false });
    } else {
      // Cas B : Il n'a pas encore aimé -> On ajoute le like et on incrémente le compteur
      await prisma.$transaction([
        prisma.jaime.create({
          data: {
            id_utilisateur: idUtilisateur,
            [champIdType]: idAnnonce,
          },
        }),
        modelAnnonce.update({
          where: { id: idAnnonce },
          data: { nbJaime: { increment: 1 } },
        }),
      ]);

      res.status(200).json({ message: "Annonce likée.", liked: true });
    }

  } catch (error) {
    console.error("Erreur lors du toggle du like :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'action." });
  }
}