import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

export async function lister(req: Request, res: Response): Promise<void> {
  try {
    const campus = await prisma.campus.findMany({
      orderBy: { nom: 'asc' },
    });

    const resultat = campus.map((c) => ({
      id: c.id.toString(),
      nom: c.nom,
      ville: c.ville,
      etablissement: c.etablissement,
    }));

    res.json(resultat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
