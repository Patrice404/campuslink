import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';

// GET /api/campus/:campusId/departements
export async function getDepartementsByCampus(req: Request, res: Response): Promise<void> {
  try {
    const campusId = BigInt(req.params.campusId);

    const departements = await prisma.departement.findMany({
      where: { id_campus: campusId },
    });

    res.json(toJSON(departements));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/departements/:departementId/formations
export async function getFormationsByDepartement(req: Request, res: Response): Promise<void> {
  try {
    const departementId = BigInt(req.params.departementId);

    const formations = await prisma.formation.findMany({
      where: { id_departement: departementId },
    });

    res.json(toJSON(formations));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}