const { prisma } = require('../lib/prismaClient');

async function lister(req, res) {
  try {
    const campus = await prisma.campus.findMany({
      orderBy: { nom: 'asc' },
    });

    const resultat = campus.map((c) => ({
      id: c.id.toString(),
      nom: c.nom,
      ville: c.ville,
      etablissement: c.etablissement,
    }));

    return res.json(resultat);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = { lister };
