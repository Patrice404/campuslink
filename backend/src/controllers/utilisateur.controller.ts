import { Request, Response } from 'express';
import { Utilisateur, CentreInteret } from '@prisma/client';
import { prisma } from '../lib/prismaClient';

// Sérialisation mise à jour avec la bio, les centres d'intérêt et id_formation
function serializeUser(user: Utilisateur) {
  return {
    id: user.id.toString(),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    dateInscription: user.dateInscription,
    photoProfil: user.photoProfil,
    bio: user.bio,
    centresInteret: user.centresInteret,
    id_formation: user.id_formation ? user.id_formation.toString() : null,
  };
}

export async function getProfil(req: Request, res: Response): Promise<void> {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: BigInt(req.utilisateur!.id) },
      // On remonte la hiérarchie pour obtenir le campus via la formation
      include: { 
        formation: {
          include: {
            departement: {
              include: {
                campus: true
              }
            }
          }
        } 
      },
    });

    if (!utilisateur) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    // Extraction sécurisée du campus
    const campus = utilisateur.formation?.departement?.campus;

    res.json({
      ...serializeUser(utilisateur),
      // On peut aussi renvoyer les détails de la formation pour le frontend
      formation: utilisateur.formation ? {
        id: utilisateur.formation.id.toString(),
        nom: utilisateur.formation.nom,
        niveau: utilisateur.formation.niveau,
      } : null,
      campus: campus
        ? {
            id: campus.id.toString(),
            nom: campus.nom,
            ville: campus.ville,
            etablissement: campus.etablissement,
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
    // Remplacement de id_campus par id_formation et ajout des nouveaux champs
    const { nom, prenom, id_formation, bio, centresInteret } = req.body;
    
    const data: { 
      nom?: string; 
      prenom?: string; 
      id_formation?: bigint; 
      photoProfil?: string;
      bio?: string;
      centresInteret?: CentreInteret[];
    } = {};

    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (id_formation) data.id_formation = BigInt(id_formation);
    if (bio !== undefined) data.bio = bio; // Permet de vider la bio si on envoie une chaîne vide
    if (centresInteret) data.centresInteret = centresInteret; 
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
      // Même logique pour remonter jusqu'au campus
      include: { 
        formation: {
          include: {
            departement: {
              include: {
                campus: true
              }
            }
          }
        } 
      },
    });

    if (!utilisateur) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const campus = utilisateur.formation?.departement?.campus;

    res.json({
      id: utilisateur.id.toString(),
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      photoProfil: utilisateur.photoProfil,
      dateInscription: utilisateur.dateInscription,
      bio: utilisateur.bio,
      centresInteret: utilisateur.centresInteret,
      formation: utilisateur.formation ? {
        id: utilisateur.formation.id.toString(),
        nom: utilisateur.formation.nom,
        niveau: utilisateur.formation.niveau,
      } : null,
      campus: campus
        ? {
            id: campus.id.toString(),
            nom: campus.nom,
            ville: campus.ville,
            etablissement: campus.etablissement,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}