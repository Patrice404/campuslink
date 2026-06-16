import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';
import { ANNONCE_CONFIG, AnnonceType, findAnnonceById } from '../lib/annonces';

// GET /annonce/:id : liste les commentaires d'une annonce (param ?type= recommandé)
export async function listerParAnnonce(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as AnnonceType | undefined;
    const found = await findAnnonceById(BigInt(req.params.id), type);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    const fk = ANNONCE_CONFIG[found.type].fk; // ex: id_exercice
    const commentaires = await prisma.commentaire.findMany({
      where: { [fk]: found.record.id },
      orderBy: { dateCreation: 'desc' },
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true, photoProfil: true } },
      },
    });

    res.json(toJSON(commentaires));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST / : ajoute un commentaire sur une annonce
// body attendu : { texte, type, id_annonce }
export async function creer(req: Request, res: Response): Promise<void> {
  try {
    const { texte, type, id_annonce } = req.body;
    if (!texte || !type || !id_annonce) {
      res.status(400).json({ message: 'texte, type et id_annonce sont requis' });
      return;
    }

    const found = await findAnnonceById(BigInt(id_annonce), type as AnnonceType);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    const fk = ANNONCE_CONFIG[found.type].fk; // ex: id_exercice
    const commentaire = await prisma.commentaire.create({
      data: { texte, id_utilisateur: BigInt(req.utilisateur!.id), [fk]: found.record.id },
    });

    res.status(201).json(toJSON(commentaire));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// PUT /:id : modifie son commentaire
export async function modifier(req: Request, res: Response): Promise<void> {
  try {
    const { texte } = req.body;
    if (!texte) {
      res.status(400).json({ message: 'texte requis' });
      return;
    }

    const commentaire = await prisma.commentaire.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!commentaire) {
      res.status(404).json({ message: 'Commentaire introuvable' });
      return;
    }
    if (commentaire.id_utilisateur.toString() !== req.utilisateur!.id) {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    const maj = await prisma.commentaire.update({ where: { id: commentaire.id }, data: { texte } });
    res.json(toJSON(maj));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// DELETE /:id : supprime son commentaire
export async function supprimer(req: Request, res: Response): Promise<void> {
  try {
    const commentaire = await prisma.commentaire.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!commentaire) {
      res.status(404).json({ message: 'Commentaire introuvable' });
      return;
    }
    if (commentaire.id_utilisateur.toString() !== req.utilisateur!.id) {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    await prisma.commentaire.delete({ where: { id: commentaire.id } });
    res.json({ message: 'Commentaire supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
