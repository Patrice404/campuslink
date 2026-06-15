import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtUtilisateur } from '../types/express';

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant ou invalide' });
    return;
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtUtilisateur;
    req.utilisateur = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token expiré ou invalide' });
  }
}
