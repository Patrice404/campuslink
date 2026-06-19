import { Request, Response } from 'express';
import { Utilisateur, CentreInteret } from '@prisma/client';
import { prisma } from '../lib/prismaClient';
import { deleteImageFromBlob, uploadImageToBlob } from '../services/storage.service';
import { verifierContenuAvecIA } from '../services/modereration2.service';
import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { genererUrlSignee } from '../services/generateUrl.service';

// 1. Modifier serializeUser pour inclure l'UUID, les centres d'intérêt et la bio
function serializeUser(user: any) {
  return {
    id: user.id.toString(),
    uuid: user.uuid,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    bio: user.bio,
    centresInteret: user.centresInteret,
    dateInscription: user.dateInscription,
    photoProfil: user.photoProfil, 
    id_campus: user.id_campus ? user.id_campus.toString() : null,
  };
}

export async function getProfil(req: Request, res: Response): Promise<void> {
  try {
    const targetId = BigInt(req.utilisateur!.id);

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: targetId },
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

    const [exCount, bpCount, tutCount, projCount, commentCount, totalLikesReceived, exercices, bonsplans, tutorats, projets] = await Promise.all([
      prisma.annonceExercice.count({ where: { id_utilisateur: targetId } }),
      prisma.annonceBonPlan.count({ where: { id_utilisateur: targetId } }),
      prisma.annonceTutorat.count({ where: { id_utilisateur: targetId } }),
      prisma.annonceProjet.count({ where: { id_utilisateur: targetId } }),
      prisma.commentaire.count({ where: { id_utilisateur: targetId } }),
      prisma.jaime.count({
        where: {
          OR: [
            { exercice: { id_utilisateur: targetId } },
            { bonplan: { id_utilisateur: targetId } },
            { tutorat: { id_utilisateur: targetId } },
            { projet: { id_utilisateur: targetId } },
          ]
        }
      }),
      prisma.annonceExercice.findMany({ where: { id_utilisateur: targetId } }),
      prisma.annonceBonPlan.findMany({ where: { id_utilisateur: targetId } }),
      prisma.annonceTutorat.findMany({ where: { id_utilisateur: targetId } }),
      prisma.annonceProjet.findMany({ where: { id_utilisateur: targetId } }),
    ]);

    const postsArray = [
      ...exercices.map(e => ({ id: e.id.toString(), type: 'EXERCICE', titre: `Exercice`, texte: e.description, datePublication: e.datePublication })),
      ...bonsplans.map(b => ({ id: b.id.toString(), type: 'BON_PLAN', titre: b.titre, texte: b.description, datePublication: b.datePublication })),
      ...tutorats.map(t => ({ id: t.id.toString(), type: 'TUTORAT', titre: `Demande de Tutorat`, texte: t.description, datePublication: t.datePublication })),
      ...projets.map(p => ({ id: p.id.toString(), type: 'PROJET', titre: p.titre, texte: p.description, datePublication: p.datePublication })),
    ].sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());

    const campus = utilisateur.formation?.departement?.campus;

    const serializedUser = serializeUser(utilisateur);
    
    // ✨ FIX SÉCURITÉ : Validation de chaîne + isolation Try/Catch contre le freeze d'infrastructure
    if (utilisateur.photoProfil && utilisateur.photoProfil.trim() !== '' && utilisateur.photoProfil !== 'null') {
      try {
        serializedUser.photoProfil = await genererUrlSignee(serializedUser.photoProfil);
      } catch (azureError) {
        console.error(" [Azure SAS] Impossible de signer l'URL (getProfil):", azureError);
        serializedUser.photoProfil = null; // Fallback sécurisé
      }
    } else {
      serializedUser.photoProfil = null;
    }

    res.json({
      ...serializedUser,
      stats: {
        posts: exCount + bpCount + tutCount + projCount,
        commentaires: commentCount,
        likes: totalLikesReceived
      },
      posts: postsArray,
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
    const { nom, prenom, id_campus, bio, centresInteret } = req.body;
    const data: any = {};

    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (bio !== undefined) data.bio = bio;
    if (centresInteret !== undefined) data.centresInteret = centresInteret;
    if (id_campus) data.id_campus = BigInt(id_campus);

    let imageUrl: string | null = null;
    if (req.file) {
      imageUrl = await uploadImageToBlob(req.file);
    }

    const verdict = await verifierContenuAvecIA("", undefined, "", imageUrl ? [imageUrl] : []);

    if (verdict === 'REJECT') {
      if (imageUrl) await deleteImageFromBlob(imageUrl);
      res.status(400).json({ message: "Votre photo a été rejetée par le système de modération." });
      return;
    }

    if (imageUrl) {
      data.photoProfil = imageUrl;
    }

    const utilisateur = await prisma.utilisateur.update({
      where: { id: BigInt(req.utilisateur!.id) },
      data,
    });

    const serializedUser = serializeUser(utilisateur);
    
    // ✨ FIX SÉCURITÉ : Validation de chaîne + isolation Try/Catch contre le freeze d'infrastructure
    if (utilisateur.photoProfil && utilisateur.photoProfil.trim() !== '' && utilisateur.photoProfil !== 'null') {
      try {
        serializedUser.photoProfil = await genererUrlSignee(utilisateur.photoProfil);
      } catch (azureError) {
        console.error("[Azure SAS] Impossible de signer l'URL (updateProfil):", azureError);
        serializedUser.photoProfil = null;
      }
    } else {
      serializedUser.photoProfil = null;
    }

    res.json(serializedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function getProfilPublic(req: Request, res: Response): Promise<void> {
  try {
    const { uuid } = req.params;
    const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { uuid: uuid },
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

    const targetId = utilisateur.id;

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

    const [exCount, bpCount, tutCount, projCount, commentCount, totalLikesReceived, exercices, bonsplans, tutorats, projets] = await Promise.all([
      prisma.annonceExercice.count({ where: { id_utilisateur: targetId } }),
      prisma.annonceBonPlan.count({ where: { id_utilisateur: targetId } }),
      prisma.annonceTutorat.count({ where: { id_utilisateur: targetId } }),
      prisma.annonceProjet.count({ where: { id_utilisateur: targetId } }),
      prisma.commentaire.count({ where: { id_utilisateur: targetId } }),
      prisma.jaime.count({
        where: {
          OR: [
            { exercice: { id_utilisateur: targetId } },
            { bonplan: { id_utilisateur: targetId } },
            { tutorat: { id_utilisateur: targetId } },
            { projet: { id_utilisateur: targetId } },
          ]
        }
      }),
      prisma.annonceExercice.findMany({ where: { id_utilisateur: targetId } }),
      prisma.annonceBonPlan.findMany({ where: { id_utilisateur: targetId } }),
      prisma.annonceTutorat.findMany({ where: { id_utilisateur: targetId } }),
      prisma.annonceProjet.findMany({ where: { id_utilisateur: targetId } }),
    ]);

    const postsArray = [
      ...exercices.map(e => ({ id: e.id.toString(), type: 'EXERCICE', titre: `Exercice`, texte: e.description, datePublication: e.datePublication })),
      ...bonsplans.map(b => ({ id: b.id.toString(), type: 'BON_PLAN', titre: b.titre, texte: b.description, datePublication: b.datePublication })),
      ...tutorats.map(t => ({ id: t.id.toString(), type: 'TUTORAT', titre: `Demande de Tutorat`, texte: t.description, datePublication: t.datePublication })),
      ...projets.map(p => ({ id: p.id.toString(), type: 'PROJET', titre: p.titre, texte: p.description, datePublication: p.datePublication })),
    ].sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());

    const campus = utilisateur.formation?.departement?.campus;

    // ✨ FIX SÉCURITÉ : Validation de chaîne + isolation Try/Catch contre le freeze d'infrastructure
    let photoSignee: string | null = null;
    if (utilisateur.photoProfil && utilisateur.photoProfil.trim() !== '' && utilisateur.photoProfil !== 'null') {
      try {
        photoSignee = await genererUrlSignee(utilisateur.photoProfil);
      } catch (azureError) {
        console.error("[Azure SAS] Impossible de signer l'URL (getProfilPublic):", azureError);
        photoSignee = null;
      }
    }

    res.json({
      id: utilisateur.id.toString(),
      uuid: utilisateur.uuid, 
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      photoProfil: photoSignee, 
      dateInscription: utilisateur.dateInscription,
      bio: utilisateur.bio,
      centresInteret: utilisateur.centresInteret,
      estBloque: !!dejaBloque,
      stats: {
        posts: exCount + bpCount + tutCount + projCount,
        commentaires: commentCount,
        likes: totalLikesReceived
      },
      posts: postsArray,
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

export async function toggleBlocage(req: Request, res: Response): Promise<void> {
  try {
    const id_bloqueur = BigInt(req.utilisateur!.id);
    const { uuid } = req.params;

    const targetUser = await prisma.utilisateur.findUnique({
      where: { uuid: uuid }
    });

    if (!targetUser) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    const id_bloque = targetUser.id;

    if (id_bloqueur === id_bloque) {
      res.status(400).json({ message: "Vous ne pouvez pas vous bloquer vous-même." });
      return;
    }

    const blocageExistant = await prisma.blocage.findUnique({
      where: {
        id_utilisateur_bloquant_id_utilisateur_bloque: {
          id_utilisateur_bloquant: id_bloqueur,
          id_utilisateur_bloque: id_bloque,
        },
      },
    });

    if (blocageExistant) {
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

export async function supprimerCompte(req: Request, res: Response): Promise<void> {
  try {
    const userId = BigInt(req.utilisateur!.id);

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { photoProfil: true }
    });

    if (user?.photoProfil) {
      await deleteImageFromBlob(user.photoProfil);
    }

    await prisma.utilisateur.delete({
      where: { id: userId },
    });

    res.json({ message: "Compte supprimé avec succès. Toutes vos données ont été nettoyées." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du compte." });
  }
}

export const chercherPourMentions = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();
    
    if (!query || query.length < 1) {
      res.json([]);
      return;
    }

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        OR: [
          { prenom: { contains: query, mode: 'insensitive' } },
          { nom: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        prenom: true,
        nom: true,
        photoProfil: true
      }
    });

    const cleanUsers = utilisateurs.map(u => {
      const username = `${u.prenom}${u.nom}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]/g, "");     
        
      return {
        id: u.id.toString(),
        prenom: u.prenom,
        nom: u.nom,
        username: username,
        photoProfil: u.photoProfil
      };
    });

    res.json(cleanUsers);
  } catch (error) {
    console.error('Erreur recherche mentions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};