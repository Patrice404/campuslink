import 'express';

export interface JwtUtilisateur {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      utilisateur?: JwtUtilisateur;
    }
  }
}
