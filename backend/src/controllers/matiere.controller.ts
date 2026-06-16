import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

export async function getMatieres(req: Request, res: Response): Promise<void> {
  try {
    // Récupération du paramètre de requête optionnel (?formationId=...)
    const { formationId } = req.query;

    let whereClause = {};

    if (formationId) {
      // Vérification basique pour s'assurer que c'est bien un nombre
      // avant de le convertir en BigInt (sinon le backend crashe)
      if (isNaN(Number(formationId))) {
        res.status(400).json({ message: 'Le format de formationId est invalide' });
        return;
      }

      // Filtre Prisma : On cherche dans le tableau "formations"
      whereClause = {
        formations: {
          some: {
            id: BigInt(formationId as string),
          },
        },
      };
    }

    // Requête Prisma avec ou sans filtre
    const matieres = await prisma.matiere.findMany({
      where: whereClause,
      orderBy: {
        titre: 'asc', // C'est toujours plus propre d'afficher les matières par ordre alphabétique sur le front
      },
    });
    console.log('Matières récupérées :', matieres); // Log pour vérifier le contenu des matières
    // CRUCIAL : Sérialisation pour convertir les BigInt en String
    // JSON.stringify() plante systématiquement si on lui laisse des BigInt bruts.
    const matieresSerialisees = matieres.map((matiere) => ({
      ...matiere,
      id: matiere.id.toString(),
    }));

    res.json(matieresSerialisees);
  } catch (error) {
    console.error('Erreur lors de la récupération des matières :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des matières' });
  }
}