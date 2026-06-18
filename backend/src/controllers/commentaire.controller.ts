import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { toJSON } from '../lib/serialize';
import { ANNONCE_CONFIG, AnnonceType, findAnnonceById } from '../lib/annonces';
import { verifierContenuAvecIA } from '../services/moderation.service';

// GET /annonce/:id : liste les commentaires d'une annonce
export async function listerParAnnonce(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as AnnonceType | undefined;
    const found = await findAnnonceById(BigInt(req.params.id), type);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    const fk = ANNONCE_CONFIG[found.type].fk; // ex: id_exercice
    const auteurSelect = { select: { id: true, nom: true, prenom: true, photoProfil: true } };

    // On ne récupère que les commentaires racine (id_parent = null) ;
    // leurs réponses sont imbriquées dans `reponses` (plus anciennes d'abord).
    const commentaires = await prisma.commentaire.findMany({
      where: { [fk]: found.record.id, id_parent: null },
      orderBy: { dateCreation: 'desc' },
      include: {
        utilisateur: auteurSelect,
        reponses: {
          orderBy: { dateCreation: 'asc' },
          include: { utilisateur: auteurSelect },
        },
      },
    });

    res.json(toJSON(commentaires));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST / : ajoute un commentaire sur une annonce + GESTION MENTIONS & NOTIFICATIONS
// POST / : ajoute un commentaire sur une annonce + GESTION MENTIONS TEXTUELLES (@PrenomNom)
/*export async function creer(req: Request, res: Response): Promise<void> {
  try {
    const { texte, type, id_annonce } = req.body;
    if (!texte || !type || !id_annonce) {
      res.status(400).json({ message: 'texte, type et id_annonce sont requis' });
      return;
    }

    const auteurIdStr = req.utilisateur!.id;
    const auteurIdBigInt = BigInt(auteurIdStr);

    const found = await findAnnonceById(BigInt(id_annonce), type as AnnonceType);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    const fk = ANNONCE_CONFIG[found.type].fk;
    
    // 1. Création du commentaire
    const commentaire = await prisma.commentaire.create({
      data: { 
        texte, 
        id_utilisateur: auteurIdBigInt, 
        [fk]: found.record.id 
      },
      include: {
        utilisateur: { select: { nom: true, prenom: true } }
      }
    });

    // 2. Détection des mentions textuelles (ex: @JeanDupont ou @Jean_Dupont)
    // Cette regex capture tous les caractères alphanumériques juste après le @
    const mentionRegex = /@([a-zA-Z0-9À-ÿ_-]+)/g;
    let match;
    const mentionsTrouvees = new Set<string>();

    while ((match = mentionRegex.exec(texte)) !== null) {
      mentionsTrouvees.add(match[1].toLowerCase()); // Stockage en minuscule pour faciliter la correspondance
    }

    // 3. Traitement des notifications si des mentions existent
    if (mentionsTrouvees.size > 0) {
      // On récupère tous les utilisateurs de la base de données (uniquement ID, nom, prenom)
      // Note : Si vous avez des milliers d'utilisateurs, il sera préférable de filtrer avec un "OR" 
      // mais cette approche est très sûre pour éviter les jointures complexes sur chaînes concaténées.
      const utilisateurs = await prisma.utilisateur.findMany({
        select: { id: true, nom: true, prenom: true }
      });

      const lienAnnonce = `/home?annonceId=${found.record.id}&type=${found.type}`;
      const notificationsData: { contenu: string; id_utilisateur: bigint; lue: boolean; lien: string }[] = [];
      const nomAuteur = `${commentaire.utilisateur.prenom} ${commentaire.utilisateur.nom}`;
      const aperçuTexte = texte.length > 60 ? texte.substring(0, 60) + '...' : texte;
      const contenuNotification = `${nomAuteur} vous a mentionné dans un commentaire : "${aperçuTexte}"`;

      for (const u of utilisateurs) {
        const idUserStr = u.id.toString();
        
        // On évite d'envoyer une notification à l'auteur lui-même
        if (idUserStr === auteurIdStr) continue;

        // Combinaisons possibles : "jean dupont", "jeandupont", "dupontjean"
        const prenomNomConcat = `${u.prenom}${u.nom}`.toLowerCase();
        const nomPrenomConcat = `${u.nom}${u.prenom}`.toLowerCase();

        // Si le texte mentionné correspond au prénom/nom d'un utilisateur
        if (mentionsTrouvees.has(prenomNomConcat) || mentionsTrouvees.has(nomPrenomConcat)) {
          notificationsData.push({
            contenu: contenuNotification,
            id_utilisateur: u.id, // C'est déjà un BigInt venant de Prisma
            lue: false
          });
        }
      }

      // 4. Insertion en masse si des cibles valides ont été trouvées
      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData,
        });
      }
    }

    res.status(201).json(toJSON(commentaire));
  } catch (err) {
    console.error("Erreur lors de la création du commentaire/notifications :", err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}*/

// POST / : ajoute un commentaire (ou une réponse via id_parent) + GESTION MENTIONS TEXTUELLES
export async function creer(req: Request, res: Response): Promise<void> {
  try {
    const { texte, type, id_annonce, id_parent } = req.body;
    if (!texte || !type || !id_annonce) {
      res.status(400).json({ message: 'texte, type et id_annonce sont requis' });
      return;
    }

    const auteurIdStr = req.utilisateur!.id;
    const auteurIdBigInt = BigInt(auteurIdStr);

    const found = await findAnnonceById(BigInt(id_annonce), type as AnnonceType);
    if (!found) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    const fk = ANNONCE_CONFIG[found.type].fk;

    // Si c'est une réponse, on vérifie que le commentaire parent existe
    let parentId: bigint | undefined;
    let parentOwnerId: bigint | undefined;
    if (id_parent) {
      const parent = await prisma.commentaire.findUnique({ where: { id: BigInt(id_parent) } });
      if (!parent) {
        res.status(404).json({ message: 'Commentaire parent introuvable' });
        return;
      }
      parentId = parent.id;
      parentOwnerId = parent.id_utilisateur;
    }

    // 0. Modération IA : on bloque les commentaires/réponses inappropriés
    const verdict = await verifierContenuAvecIA(texte);
    if (verdict === 'REJECT') {
      res.status(400).json({ message: "Ce commentaire enfreint les règles de la communauté et a été bloqué." });
      return;
    }

    // 1. Création du commentaire (ou de la réponse)
    const commentaire = await prisma.commentaire.create({
      data: {
        texte,
        id_utilisateur: auteurIdBigInt,
        [fk]: found.record.id,
        ...(parentId ? { id_parent: parentId } : {}),
      },
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true, photoProfil: true } }
      }
    });

    const nomAuteur = `${commentaire.utilisateur.prenom} ${commentaire.utilisateur.nom}`;
    const aperçuTexte = texte.length > 60 ? texte.substring(0, 60) + '...' : texte;
    const lienAnnonce = `/home?annonceId=${found.record.id}&type=${found.type}`;

    // Array pour stocker toutes les notifications à insérer d'un coup
    const notificationsData: { contenu: string; id_utilisateur: bigint; lue: boolean; lien: string }[] = [];

    // 2. GESTION DE LA NOTIFICATION DE RÉPONSE
    // Si c'est une réponse et que l'auteur de la réponse n'est pas l'auteur du commentaire parent
    if (parentId && parentOwnerId && parentOwnerId !== auteurIdBigInt) {
      notificationsData.push({
        contenu: `${nomAuteur} a répondu à votre commentaire : "${aperçuTexte}"`,
        id_utilisateur: parentOwnerId,
        lue: false,
        lien: lienAnnonce
      });
    }

    // 3. GESTION DES MENTIONS TEXTUELLES (ex: @JeanDupont)
    const mentionRegex = /@([a-zA-Z0-9À-ÿ_-]+)/g;
    let match;
    const mentionsTrouvees = new Set<string>();

    while ((match = mentionRegex.exec(texte)) !== null) {
      mentionsTrouvees.add(match[1].toLowerCase());
    }

    console.log("=== TEST MENTIONS ===");
    console.log("Texte reçu :", texte);
    console.log("Mentions extraites par la Regex :", Array.from(mentionsTrouvees));

    if (mentionsTrouvees.size > 0) {
      const utilisateurs = await prisma.utilisateur.findMany({
        select: { id: true, nom: true, prenom: true }
      });

      const contenuNotificationMention = `${nomAuteur} vous a mentionné dans un commentaire : "${aperçuTexte}"`;

      for (const u of utilisateurs) {
        // Formats attendus en minuscules sans espace
        const prenomNomConcat = `${u.prenom}${u.nom}`.toLowerCase();
        const nomPrenomConcat = `${u.nom}${u.prenom}`.toLowerCase();

        // ⚡️ NOTE : On NE met PAS de "if (u.id.toString() === auteurIdStr) continue;" 
        // pour permettre l'auto-mention complète !
        if (mentionsTrouvees.has(prenomNomConcat) || mentionsTrouvees.has(nomPrenomConcat)) {
          console.log(`-> MATCH TROUVÉ pour la mention de l'utilisateur ID: ${u.id}`);
          
          // On vérifie si une notification pour cet utilisateur n'a pas déjà été ajoutée (ex: s'il a aussi reçu la notif de réponse)
          const dejaNotifie = notificationsData.some(n => n.id_utilisateur === u.id);
          if (!dejaNotifie) {
            notificationsData.push({
              contenu: contenuNotificationMention,
              id_utilisateur: u.id,
              lue: false,
              lien: lienAnnonce,
            });
          }
        }
      }
    }

    // 4. Insertion groupée en base de données de toutes les notifications générées (réponses + mentions)
    if (notificationsData.length > 0) {
      const result = await prisma.notification.createMany({
        data: notificationsData,
      });
      console.log(`Nombre de notifications insérées en BDD : ${result.count}`);
    }

    console.log("=====================");

    res.status(201).json(toJSON(commentaire));
  } catch (err) {
    console.error("Erreur lors de la création du commentaire/notifications :", err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
// PUT /:id : modifie son commentaire
export async function modifier(req: Request, res: Response): Promise<void> {
  try {
    const { texte } = req.body;
    if (!texte) {
      res.status(400).json({ message: 'texte requis' });
      return;
    }

    const commentaire = await prisma.commentaire.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!commentaire) {
      res.status(404).json({ message: 'Commentaire introuvable' });
      return;
    }
    if (commentaire.id_utilisateur.toString() !== req.utilisateur!.id) {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    const maj = await prisma.commentaire.update({ where: { id: commentaire.id }, data: { texte } });
    res.json(toJSON(maj));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// DELETE /:id : supprime son commentaire
export async function supprimer(req: Request, res: Response): Promise<void> {
  try {
    const commentaire = await prisma.commentaire.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!commentaire) {
      res.status(404).json({ message: 'Commentaire introuvable' });
      return;
    }
    if (commentaire.id_utilisateur.toString() !== req.utilisateur!.id) {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    await prisma.commentaire.delete({ where: { id: commentaire.id } });
    res.json({ message: 'Commentaire supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}