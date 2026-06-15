import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Utilisateur } from '@prisma/client';
import { prisma } from '../lib/prismaClient';

function serializeUser(user: Utilisateur) {
  return {
    id: user.id.toString(),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    dateInscription: user.dateInscription,
    photoProfil: user.photoProfil,
    id_campus: user.id_campus ? user.id_campus.toString() : null,
  };
}

function genererToken(user: Utilisateur): string {
  return jwt.sign(
    { id: user.id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}

export async function inscription(req: Request, res: Response): Promise<void> {
  try {
    const { nom, prenom, email, motDePasse, role, id_campus } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !role) {
      res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
      return;
    }

    const existant = await prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      res.status(409).json({ message: 'Un compte avec cet email existe déjà' });
      return;
    }

    const hash = await bcrypt.hash(motDePasse, 10);

    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hash,
        role,
        id_campus: id_campus ? BigInt(id_campus) : null,
      },
    });

    res.status(201).json({ token: genererToken(utilisateur), utilisateur: serializeUser(utilisateur) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function connexion(req: Request, res: Response): Promise<void> {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      res.status(400).json({ message: 'Email et mot de passe requis' });
      return;
    }

    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur) {
      res.status(401).json({ message: 'Identifiants incorrects' });
      return;
    }

    const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!valide) {
      res.status(401).json({ message: 'Identifiants incorrects' });
      return;
    }

    res.json({ token: genererToken(utilisateur), utilisateur: serializeUser(utilisateur) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: BigInt(req.utilisateur!.id) },
    });

    if (!utilisateur) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    res.json(serializeUser(utilisateur));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
