import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { ANNONCE_CONFIG, AnnonceType, findAnnonceById } from '../lib/annonces';

// POST /annonces/:id/jaime : ajoute ou retire le "j'aime" de l'utilisateur connecté
export async function toggle(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as AnnonceType | undefined;
    const found = await findAnnonceById(BigInt(req.params.id), type);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    const id_utilisateur = BigInt(req.utilisateur!.id);
    const fk = ANNONCE_CONFIG[found.type].fk; // ex: id_exercice
    const where = { id_utilisateur, [fk]: found.record.id };

    const existant = await prisma.jaime.findFirst({ where });

    if (existant) {
      await prisma.jaime.delete({ where: { id: existant.id } });
      await ANNONCE_CONFIG[found.type].delegate.update({
        where: { id: found.record.id },
        data: { nbJaime: { decrement: 1 } },
      });
      res.json({ jaime: false, message: "J'aime retiré" });
      return;
    }

    await prisma.jaime.create({ data: { id_utilisateur, [fk]: found.record.id } });
    await ANNONCE_CONFIG[found.type].delegate.update({
      where: { id: found.record.id },
      data: { nbJaime: { increment: 1 } },
    });
    res.json({ jaime: true, message: "J'aime ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
