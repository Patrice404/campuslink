const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Nettoyage...");
  await prisma.jaime.deleteMany();
  await prisma.commentaire.deleteMany();
  await prisma.candidature.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.blocage.deleteMany();
  await prisma.annonceExercice.deleteMany();
  await prisma.annonceBonPlan.deleteMany();
  await prisma.annonceTutorat.deleteMany();
  await prisma.annonceProjet.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.matiere.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.departement.deleteMany();
  await prisma.campus.deleteMany();

  // 1. STRUCTURE ACADÉMIQUE
  const campusList = ['INSA CVL', 'IUT Bourges', 'Univ Orléans'];
  const deps = ['Informatique', 'Génie Civil', 'Mécanique'];

  for (const cNom of campusList) {
    const campus = await prisma.campus.create({ data: { nom: cNom, ville: 'Bourges', etablissement: 'Université' } });
    for (const dNom of deps) {
      const dep = await prisma.departement.create({ data: { nom: dNom, id_campus: campus.id } });
      await prisma.formation.createMany({
        data: [{ nom: `Licence ${dNom}`, niveau: 'L1', id_departement: dep.id }, { nom: `Master ${dNom}`, niveau: 'M1', id_departement: dep.id }]
      });
    }
  }

  const formations = await prisma.formation.findMany();
  const matieres = await prisma.matiere.createManyAndReturn({
    data: ['Algorithmique', 'Bases de données', 'Web', 'Réseaux', 'IA', 'Droit'].map(m => ({ titre: m, annee: 'L1' }))
  });

  // 2. UTILISATEURS (Patrice + 29 autres)
  const users = [];
  users.push(await prisma.utilisateur.create({
    data: {
      nom: 'COTCHO', prenom: 'Patrice', email: 'patricecotcho@gmail.com',
      motDePasse: '$2b$10$.G/8tCnlMQaKvBhI/vAvTueLiyHVOU8fnIHhLx8.aI4tikFdtR6VS',
      role: 'ETUDIANT', id_formation: formations[0].id, centresInteret: ['PROJET', 'ENTRAIDE']
    }
  }));

  for (let i = 0; i < 29; i++) {
    users.push(await prisma.utilisateur.create({
      data: {
        nom: `User${i}`, prenom: `Nom${i}`, email: `user${i}@test.fr`,
        motDePasse: 'password', role: 'ETUDIANT',
        id_formation: formations[i % formations.length].id
      }
    }));
  }

  // 3. ANNONCES (100 au total)
  const sousTypes = ['JOB_ETUDIANT', 'ALTERNANCE', 'COLOCATION', 'FETE', 'RESTAURANT', 'HACKATHON'];
  const vis = ['PUBLIQUE', 'PROMOTION', 'ETUDIANT'];

  for (let i = 0; i < 100; i++) {
    const user = users[i % users.length];
    const type = i % 4;

    if (type === 0) await prisma.annonceExercice.create({ data: { description: `Exercice ${i}`, annee: 'L1', id_matiere: matieres[i % matieres.length].id, id_utilisateur: user.id, visibilite: vis[i % 3] } });
    else if (type === 1) await prisma.annonceBonPlan.create({ data: { titre: `Plan ${i}`, description: "Description", sousType: sousTypes[i % sousTypes.length], id_utilisateur: user.id, visibilite: vis[i % 3] } });
    else if (type === 2) await prisma.annonceTutorat.create({ data: { description: `Tutorat ${i}`, nbCandidatsVoulus: 3, id_matiere: matieres[i % matieres.length].id, id_utilisateur: user.id, visibilite: vis[i % 3] } });
    else await prisma.annonceProjet.create({ data: { titre: `Projet ${i}`, description: "Description", id_utilisateur: user.id, visibilite: vis[i % 3] } });
  }

  // ... après la création des annonces dans votre script ...

  console.log("💬 Génération des interactions sociales...");
  
  // Récupération de toutes les annonces créées pour interagir avec
  const [exercices, bonsPlans, tutorats, projets] = await Promise.all([
    prisma.annonceExercice.findMany(),
    prisma.annonceBonPlan.findMany(),
    prisma.annonceTutorat.findMany(),
    prisma.annonceProjet.findMany()
  ]);

  const allAnnonces = [...exercices, ...bonsPlans, ...tutorats, ...projets];

  // Création de 50 commentaires aléatoires
  for (let i = 0; i < 50; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomAnnonce = allAnnonces[Math.floor(Math.random() * allAnnonces.length)];

    await prisma.commentaire.create({
      data: {
        texte: `Ceci est le commentaire n°${i} pour l'annonce ${randomAnnonce.id}`,
        id_utilisateur: randomUser.id,
        // Association dynamique au bon modèle selon le type d'annonce
        id_exercice: randomAnnonce.type === 'EXERCICE' ? randomAnnonce.id : null,
        id_bonplan: randomAnnonce.type === 'BON_PLAN' ? randomAnnonce.id : null,
        id_tutorat: randomAnnonce.type === 'TUTORAT' ? randomAnnonce.id : null,
        id_projet: randomAnnonce.type === 'PROJET' ? randomAnnonce.id : null,
      }
    });

    // Ajout d'un "J'aime" aléatoire une fois sur deux
    if (i % 2 === 0) {
      await prisma.jaime.create({
        data: {
          id_utilisateur: randomUser.id,
          id_exercice: randomAnnonce.type === 'EXERCICE' ? randomAnnonce.id : null,
          id_bonplan: randomAnnonce.type === 'BON_PLAN' ? randomAnnonce.id : null,
          id_tutorat: randomAnnonce.type === 'TUTORAT' ? randomAnnonce.id : null,
          id_projet: randomAnnonce.type === 'PROJET' ? randomAnnonce.id : null,
        }
      });
    }
  }

  console.log("✅ Seed massif terminé.");
}
main().catch(console.error).finally(() => prisma.$disconnect());