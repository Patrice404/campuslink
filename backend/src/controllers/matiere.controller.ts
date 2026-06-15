import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';

// GET /api/matieres : liste toutes les matières (id, titre, annee)
// Utilisé pour peupler dynamiquement les selects "Matière" des formulaires
// d'annonce (Exercice, Tutorat) côté frontend.
export async function lister(req: Request, res: Response): Promise<void> {
  try {
    const matieres = await prisma.matiere.findMany({
      orderBy: [{ annee: 'asc' }, { titre: 'asc' }],
    });

    res.json(toJSON(matieres));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}