import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import utilisateurRoutes from './routes/utilisateur.routes';
import campusRoutes from './routes/campus.routes';
import annonceRoutes from './routes/annonce.routes';

dotenv.config();

const app = express();

// Origines autorisées (front Vite en dev sur 5173, + variable d'env pour la prod).
const origines = [
<<<<<<< HEAD
  process.env.CORS_API_URL_FRONTEND, // Si c'est défini dans ton fichier .env
  'http://localhost:5173',           // L'URL de ton front Vite en développement
=======
  process.env.CORS_API_URL_FRONTEND || 'http://localhost:5173',
>>>>>>> 31f06f1314e7c5c8f377c7fa14823aaad71de959
  'http://localhost:8080',
  process.env.FRONTEND_URL,          // L'URL pour la production
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
app.use('/api/annonces', annonceRoutes);
// Routes à brancher une fois leurs controllers implémentés :
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
