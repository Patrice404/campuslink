import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRoute from './routes/users'; // Les routes se trouvent dans le dossier routes
// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', usersRoute);

// Route de test simple
app.get('/', (req, res) => {
  res.send('CampusLink API est opérationnelle !');
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});