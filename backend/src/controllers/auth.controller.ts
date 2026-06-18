import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Utilisateur } from '@prisma/client';
import { prisma } from '../lib/prismaClient';
import { genererCode, envoyerCode } from '../lib/mailer';

// Durée de validité d'un code de vérification (en minutes)
const CODE_DUREE_MIN = 10;

function serializeUser(utilisateur: any) {
  return {
    id: utilisateur.id.toString(), // ⚡️ CRUCIAL : Conversion du BigInt en String
    uuid: utilisateur.uuid,
    email: utilisateur.email,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    role: utilisateur.role,
    photoProfil: utilisateur.photoProfil,
    id_formation: utilisateur.id_formation ? utilisateur.id_formation.toString() : null 
    
  };
}

function genererToken(user: Utilisateur): string {
  return jwt.sign(
    { id: user.id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}


// POST /send-verification : reçoit TOUTES les infos du futur compte au moment de
// l'inscription, génère un code, stocke infos + code (avec expiration), envoie l'email.
export async function sendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { nom, prenom, email, motDePasse, role, id_formation } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !role || !id_formation) {
      res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis (nom, prenom, email, motDePasse, role, id_formation)' });
      return;
    }

    // Si un compte existe déjà avec cet email, inutile de vérifier
    const existant = await prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      res.status(409).json({ message: 'Un compte avec cet email existe déjà' });
      return;
    }

    const code = genererCode();
    const expiration = new Date(Date.now() + CODE_DUREE_MIN * 60 * 1000);
    const hash = await bcrypt.hash(motDePasse, 10); // on ne stocke jamais le mot de passe en clair
    const formation = id_formation ? BigInt(id_formation) : null;

    // Une seule inscription en attente par email : on écrase l'ancienne
    await prisma.verificationEmail.upsert({
      where: { email },
      update: { code, expiration, nom, prenom, motDePasse: hash, role, id_formation: formation },
      create: { email, code, expiration, nom, prenom, motDePasse: hash, role, id_formation: formation },
    });

    await envoyerCode(email, 'Code de vérification CampusLink', 'Voici ton code de vérification :', code);

    res.json({ message: 'Code de vérification envoyé par email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST /verify-and-register : reçoit juste email + code, vérifie, puis crée le compte
// à partir des infos déjà stockées à l'étape send-verification.
export async function verifyAndRegister(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: 'email et code sont requis' });
      return;
    }

    const verif = await prisma.verificationEmail.findUnique({ where: { email } });
    if (!verif || verif.code !== code) {
      res.status(400).json({ message: 'Code de vérification invalide' });
      return;
    }
    if (verif.expiration < new Date()) {
      res.status(400).json({ message: 'Code de vérification expiré' });
      return;
    }

    // Sécurité : l'email ne doit pas avoir été pris entre-temps
    const existant = await prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      res.status(409).json({ message: 'Un compte avec cet email existe déjà' });
      return;
    }

    // Toutes les infos viennent de l'étape précédente (mot de passe déjà hashé)
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: verif.nom,
        prenom: verif.prenom,
        email: verif.email,
        motDePasse: verif.motDePasse,
        role: verif.role,
        id_formation: verif.id_formation,
      },
    });

    // L'inscription en attente a servi : on la supprime
    await prisma.verificationEmail.delete({ where: { email } });

    res.status(201).json({ token: genererToken(utilisateur), utilisateur: serializeUser(utilisateur) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function connexion(req: Request, res: Response): Promise<void> {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse ) {
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
