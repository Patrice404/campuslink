import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

// GET /api/notifications : Liste les notifications de l'utilisateur connecté
export const lister = async (req: Request, res: Response): Promise<void> => {
  try {
    // Correction ici : on utilise req.utilisateur (avec vérification de sécurité)
    if (!req.utilisateur || !req.utilisateur.id) {
      res.status(401).json({ error: 'Utilisateur non authentifié ou session invalide' });
      return;
    }

    const userId = BigInt(req.utilisateur.id);

    const notifications = await prisma.notification.findMany({
      where: { id_utilisateur: userId },
      orderBy: { dateCreation: 'desc' }
    });

    // Conversion sécurisée des BigInt en string pour éviter les rejets TypeScript/JSON au Frontend
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

// PUT /api/notifications/:id/lire : Marquer une alerte comme consultée
export const marquerLue = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ error: 'ID de notification manquant' });
      return;
    }

    const notifId = BigInt(req.params.id);

    await prisma.notification.update({
      where: { id: notifId },
      data: { lue: true }
    });

    res.json({ success: true, message: "Notification marquée comme lue" });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};