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
    const targetId = BigInt(req.utilisateur!.id);

    // ✨ CORRECTION : On utilise la même logique d'inclusion imbriquée que getProfilPublic
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

    // Récupération et calcul des statistiques + agrégation des 4 types d'annonces
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

    // Fusionner et formater toutes les annonces pour les lister dans "Activités récentes"
    const postsArray = [
      ...exercices.map(e => ({ id: e.id.toString(), type: 'EXERCICE', titre: `Exercice`, texte: e.description, datePublication: e.datePublication })),
      ...bonsplans.map(b => ({ id: b.id.toString(), type: 'BON_PLAN', titre: b.titre, texte: b.description, datePublication: b.datePublication })),
      ...tutorats.map(t => ({ id: t.id.toString(), type: 'TUTORAT', titre: `Demande de Tutorat`, texte: t.description, datePublication: t.datePublication })),
      ...projets.map(p => ({ id: p.id.toString(), type: 'PROJET', titre: p.titre, texte: p.description, datePublication: p.datePublication })),
    ].sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());

    // ✨ CORRECTION : On extrait correctement le campus à partir de la formation
    const campus = utilisateur.formation?.departement?.campus;

    res.json({
      ...serializeUser(utilisateur),
      stats: {
        posts: exCount + bpCount + tutCount + projCount, 
        commentaires: commentCount,
        likes: totalLikesReceived
      },
      posts: postsArray,
      // ✨ CORRECTION : On utilise la variable extraite en toute sécurité
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

    // Vérification du blocage existant
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

    // ✨ NOUVEAU : Récupération et calcul des statistiques pour le profil public
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

    res.json({
      id: utilisateur.id.toString(),
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      photoProfil: utilisateur.photoProfil,
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