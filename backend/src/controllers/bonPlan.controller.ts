import { Request, Response } from 'express';
// On importe l'enum directement depuis le client Prisma généré
import { SousTypeBonPlan } from '@prisma/client'; 

/**
 * Récupère dynamiquement la liste des enums SousTypeBonPlan 
 * définis dans le schéma Prisma pour les envoyer au frontend.
 */
export async function getBonPlanSubTypes(req: Request, res: Response): Promise<void> {
  try {
    // Object.values() transforme l'objet Enum en un tableau de chaînes de caractères
    // Ex: ['JOB_ETUDIANT', 'ALTERNANCE', 'COLOCATION', ...]
    const subTypes = Object.values(SousTypeBonPlan);

    // On renvoie le tableau au format JSON avec un statut 200 Success
    res.status(200).json(subTypes);
  } catch (error) {
    console.error("Erreur dans getBonPlanSubTypes :", error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la récupération des catégories de bons plans." 
    });
  }
}