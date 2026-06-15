const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prismaClient');

function serializeUser(user) {
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

async function inscription(req, res) {
  try {
    const { nom, prenom, email, motDePasse, role, id_campus } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !role) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }

    const existant = await prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      return res.status(409).json({ message: 'Un compte avec cet email existe déjà' });
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

    const token = jwt.sign(
      { id: utilisateur.id.toString(), email: utilisateur.email, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ token, utilisateur: serializeUser(utilisateur) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function connexion(req, res) {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!valide) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: utilisateur.id.toString(), email: utilisateur.email, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, utilisateur: serializeUser(utilisateur) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function me(req, res) {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: BigInt(req.utilisateur.id) },
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    return res.json(serializeUser(utilisateur));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = { inscription, connexion, me };
