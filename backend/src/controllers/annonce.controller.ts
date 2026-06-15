import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';
import { ANNONCE_CONFIG, AnnonceType, findAnnonceById } from '../lib/annonces';

const TYPES: AnnonceType[] = ['EXERCICE', 'BON_PLAN', 'TUTORAT', 'PROJET'];

// GET / : liste toutes les annonces (les 4 types fusionnés, plus récentes d'abord)
export async function lister(_req: Request, res: Response): Promise<void> {
  try {
    const [exercices, bonsPlans, tutorats, projets] = await Promise.all([
      prisma.annonceExercice.findMany(),
      prisma.annonceBonPlan.findMany(),
      prisma.annonceTutorat.findMany(),
      prisma.annonceProjet.findMany(),
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
          data: { annee: b.annee, texte: b.texte, id_matiere: BigInt(b.id_matiere), id_utilisateur, image, lien },
        });
        break;
      case 'BON_PLAN':
        annonce = await prisma.annonceBonPlan.create({
          data: { titre: b.titre, texte: b.texte, sousType: b.sousType, id_utilisateur, image, lien },
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
          data: { titre: b.titre, texte: b.texte, description: b.description, id_utilisateur, image, lien },
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
    for (const champ of ['titre', 'texte', 'description', 'annee', 'lien', 'sousType']) {
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
