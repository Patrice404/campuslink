import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Récupérer toutes les annonces d'entraide / exercices
export const getExercices = async (req: Request, res: Response): Promise<void> => {
  try {
    const exercices = await prisma.annonceExercice.findMany({
      include: {
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            photoProfil: true
          }
        },
        matiere: true
      },
      orderBy: {
        datePublication: 'desc'
      }
    });

    // Formatage rapide pour s'assurer que les compteurs sont présents
    const formatEtudiants = exercices.map(exo => ({
      ...exo,
      nbJaime: exo.nbJaime || 0
    }));

    res.status(200).json(formatEtudiants);
  } catch (error) {
    console.error("Erreur lors de la récupération des exercices :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des entraides." });
  }
};