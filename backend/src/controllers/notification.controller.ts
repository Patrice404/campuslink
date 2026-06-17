import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

// 1. Lister les notifications de l'utilisateur connecté
/*export const lister = async (req: Request, res: Response): Promise<void> => {
  try {
    // Le middleware auth injecte l'utilisateur dans req.user
    // Attention : d'après notre schema, l'id est un BigInt
    const userId = BigInt((req as any).user.id);

    const notifications = await prisma.notification.findMany({
      where: {
        id_utilisateur: userId
      },
      orderBy: {
        dateCreation: 'desc' // Les plus récentes en premier
      }
    });

    // Astuce : Express ne sait pas sérialiser les BigInt en JSON par défaut.
    // On transforme les id (BigInt) en String pour éviter que Node ne plante.
    const cleanNotifications = notifications.map((notif) => ({
      ...notif,
      id: notif.id.toString(),
      id_utilisateur: notif.id_utilisateur.toString()
    }));

    res.json(cleanNotifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// 2. Optionnel pour l'instant mais prêt pour la suite : Marquer une notification comme lue
export const marquerLue = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifId = BigInt(req.params.id);

    await prisma.notification.update({
      where: { id: notifId },
      data: { lue: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de mettre à jour la notification' });
  }
};
*/