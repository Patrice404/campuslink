import { Request, Response } from 'express';
import { Utilisateur } from '@prisma/client';
import { prisma } from '../lib/prismaClient';

function serializeUser(user: Utilisateur) {
  return {
    id: user.id.toString(),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    dateInscription: user.dateInscription,
    photoProfil: user.photoProfil,
    id_campus: user.id_campus ? user.id_campus.toString() : null,
  };
}

export async function getProfil(req: Request, res: Response): Promise<void> {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: BigInt(req.utilisateur!.id) },
      include: { campus: true },
    });

    if (!utilisateur) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    res.json({
      ...serializeUser(utilisateur),
      campus: utilisateur.campus
        ? {
            id: utilisateur.campus.id.toString(),
            nom: utilisateur.campus.nom,
            ville: utilisateur.campus.ville,
            etablissement: utilisateur.campus.etablissement,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function updateProfil(req: Request, res: Response): Promise<void> {
  try {
    const { nom, prenom, id_campus } = req.body;
    const data: { nom?: string; prenom?: string; id_campus?: bigint; photoProfil?: string } = {};

    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (id_campus) data.id_campus = BigInt(id_campus);
    if (req.file) data.photoProfil = req.file.filename;

    const utilisateur = await prisma.utilisateur.update({
      where: { id: BigInt(req.utilisateur!.id) },
      data,
    });

    res.json(serializeUser(utilisateur));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function getProfilPublic(req: Request, res: Response): Promise<void> {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: BigInt(req.params.id) },
      include: { campus: true },
    });

    if (!utilisateur) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    res.json({
      id: utilisateur.id.toString(),
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      photoProfil: utilisateur.photoProfil,
      dateInscription: utilisateur.dateInscription,
      campus: utilisateur.campus
        ? {
            id: utilisateur.campus.id.toString(),
            nom: utilisateur.campus.nom,
            ville: utilisateur.campus.ville,
            etablissement: utilisateur.campus.etablissement,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
