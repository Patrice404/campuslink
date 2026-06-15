import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import utilisateurRoutes from './routes/utilisateur.routes';
import campusRoutes from './routes/campus.routes';

dotenv.config();

const app = express();

// Origines autorisées (front Vite en dev sur 5173, + variable d'env pour la prod).
const origines = [
  CORS_API_URL_FRONTEND ||
  'http://localhost:8080',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: origines,
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req: Request, res: Response) => {
  res.send('CampusLink API est opérationnelle !');
});

app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/campus', campusRoutes);
// Routes à brancher une fois leurs controllers implémentés :
// app.use('/api/annonces', annonceRoutes);
// app.use('/api/commentaires', commentaireRoutes);
// app.use('/api/candidatures', candidatureRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/hashtags', hashtagRoutes);
// app.use('/api/matieres', matiereRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route introuvable' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur CampusLink démarré sur le port ${PORT}`));
