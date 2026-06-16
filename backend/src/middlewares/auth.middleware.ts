import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtUtilisateur } from '../types/express'; // Importez le type créé ci-dessus

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant ou invalide' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    // Le typage ici permet d'assigner le résultat à JwtUtilisateur
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtUtilisateur;
    
    // Maintenant, TypeScript ne soulignera plus d'erreur sur 'req.utilisateur'
    req.utilisateur = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token expiré ou invalide' });
  }
}