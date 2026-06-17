import { Request, Response } from 'express';
import { Utilisateur, CentreInteret } from '@prisma/client';
import { prisma } from '../lib/prismaClient';

// 1. Modifier serializeUser pour inclure les centres d'intérêt et la bio
function serializeUser(user: any) {
  return {
    id: user.id.toString(),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    bio: user.bio,
    centresInteret: user.centresInteret, // ✨ Ajout
    dateInscription: user.dateInscription,
    photoProfil: user.photoProfil,
    id_campus: user.id_campus ? user.id_campus.toString() : null,
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

// 2. Mettre à jour la fonction de modification pour gérer bio et centresInteret
export async function updateProfil(req: Request, res: Response): Promise<void> {
  try {
    const { nom, prenom, id_campus, bio, centresInteret } = req.body;
    const data: any = {};

    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (bio !== undefined) data.bio = bio;
    if (centresInteret !== undefined) data.centresInteret = centresInteret; // Tableau d'enums ex: ['PROJET', 'EXERCICE']
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
    const targetId = BigInt(req.params.id);
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: targetId },
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

    // ✨ NOUVEAU : On cherche si un blocage existe entre l'utilisateur connecté et ce profil
    const dejaBloque = idConnected 
      ? await prisma.blocage.findUnique({
          where: {
            id_utilisateur_bloquant_id_utilisateur_bloque: {
              id_utilisateur_bloquant: idConnected,
              id_utilisateur_bloque: targetId,
            },
          },
        })
      : null;

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
      estBloque: !!dejaBloque, // ✨ NOUVEAU : Renvoie true si bloqué, false sinon
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


// 3. NOUVEAU : Fonction Toggle pour Bloquer / Débloquer un utilisateur
export async function toggleBlocage(req: Request, res: Response): Promise<void> {
  try {
    const id_bloqueur = BigInt(req.utilisateur!.id);
    const id_bloque = BigInt(req.params.id);

    if (id_bloqueur === id_bloque) {
      res.status(400).json({ message: "Vous ne pouvez pas vous bloquer vous-même." });
      return;
    }

    // On cherche si le blocage existe déjà
    const blocageExistant = await prisma.blocage.findUnique({
      where: {
        id_utilisateur_bloquant_id_utilisateur_bloque: {
          id_utilisateur_bloquant: id_bloqueur,
          id_utilisateur_bloque: id_bloque,
        },
      },
    });

    if (blocageExistant) {
      // Si présent, on débloque
      await prisma.blocage.delete({
        where: {
          id_utilisateur_bloquant_id_utilisateur_bloque: {
            id_utilisateur_bloquant: id_bloqueur,
            id_utilisateur_bloque: id_bloque,
          },
        },
      });
      res.json({ bloque: false, message: "Utilisateur débloqué avec succès." });
    } else {
      // Si absent, on bloque
      await prisma.blocage.create({
        data: {
          id_utilisateur_bloquant: id_bloqueur,
          id_utilisateur_bloque: id_bloque,
        },
      });
      res.json({ bloque: true, message: "Utilisateur bloqué." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors du blocage." });
  }
}

// 4. NOUVEAU : Supprimer définitivement son propre compte (RGPD)
export async function supprimerCompte(req: Request, res: Response): Promise<void> {
  try {
    await prisma.utilisateur.delete({
      where: { id: BigInt(req.utilisateur!.id) },
    });
    res.json({ message: "Compte supprimé avec succès. Toutes vos données ont été nettoyées." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du compte." });
  }
}