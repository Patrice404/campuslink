import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // 1. On vérifie si le middleware d'authentification classique (auth) est bien passé avant
  if (!req.utilisateur) {
    res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
    return;
  }

  // 2. On vérifie le rôle de la personne connectée
  if (req.utilisateur.role !== 'ADMIN') {
    res.status(403).json({ error: "Accès interdit. Droits d'administrateur requis." });
    return;
  }

  // 3. Si tout est bon, on passe à la suite (le contrôleur)
  next();
};