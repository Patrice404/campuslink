import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import utilisateurRoutes from './routes/utilisateur.routes';
import campusRoutes from './routes/campus.routes';
import annonceRoutes from './routes/annonce.routes';
import matiereRoutes from './routes/matiere.routes';

dotenv.config();

const app = express();

// Garantit que le dossier uploads existe au démarrage
// (le volume Docker peut être vide au premier lancement)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé.');
}

// Origines autorisées (front Vite en dev sur 5173, + variable d'env pour la prod)
const origines = [
  process.env.CORS_API_URL_FRONTEND || 'http://localhost:5173',
  'http://localhost:8080',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({ origin: origines, credentials: true }));
app.use(express.json());

// Sert les fichiers uploadés (images des annonces) depuis le volume Docker
// Ex: GET /uploads/1718450000123.jpg → /app/uploads/1718450000123.jpg
app.use('/uploads', express.static(uploadsDir));

app.get('/', (_req: Request, res: Response) => {
  res.send('CampusLink API est opérationnelle !');
});

app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/matieres', matiereRoutes);

// Routes à brancher une fois leurs controllers implémentés :
// app.use('/api/commentaires', commentaireRoutes);
// app.use('/api/candidatures', candidatureRoutes);
// app.use('/api/notifications', notificationRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route introuvable' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur CampusLink démarré sur le port ${PORT}`));