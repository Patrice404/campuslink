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

async function getProfil(req, res) {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: BigInt(req.utilisateur.id) },
      include: { campus: true },
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    return res.json({
      ...serializeUser(utilisateur),
      campus: utilisateur.campus
        ? {
            id: utilisateur.campus.id.toString(),
            nom: utilisateur.campus.nom,
            ville: utilisateur.campus.ville,
            etablissement: utilisateur.campus.etablissement,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function updateProfil(req, res) {
  try {
    const { nom, prenom, id_campus } = req.body;
    const data = {};

    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (id_campus) data.id_campus = BigInt(id_campus);
    if (req.file) data.photoProfil = req.file.filename;

    const utilisateur = await prisma.utilisateur.update({
      where: { id: BigInt(req.utilisateur.id) },
      data,
    });

    return res.json(serializeUser(utilisateur));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function getProfilPublic(req, res) {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: BigInt(req.params.id) },
      include: { campus: true },
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    return res.json({
      id: utilisateur.id.toString(),
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      photoProfil: utilisateur.photoProfil,
      dateInscription: utilisateur.dateInscription,
      campus: utilisateur.campus
        ? {
            id: utilisateur.campus.id.toString(),
            nom: utilisateur.campus.nom,
            ville: utilisateur.campus.ville,
            etablissement: utilisateur.campus.etablissement,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = { getProfil, updateProfil, getProfilPublic };
