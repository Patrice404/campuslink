// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient(); // Notre traducteur vers PostgreSQL

app.use(cors());
app.use(express.json());

// 🛣️ CRÉATION DE LA ROUTE HELLO WORLD
// Quand le frontend demande /api/users, on exécute ce code
app.get('/api/users', async (req, res) => {
  try {
    // On demande à Prisma de chercher TOUS les utilisateurs
    const users = await prisma.user.findMany();
    // On les renvoie au format JSON
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Lancement du serveur
app.listen(3000, () => {
  console.log('🚀 Serveur API CampusLink lancé sur le port 3000');
});