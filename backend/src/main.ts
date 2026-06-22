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
import commentaireRoutes from './routes/commentaire.routes';
import entraideRoutes from './routes/entraide.routes';
import projetRoutes from './routes/projet.routes';
import academiqueRoutes from './routes/academique.routes';
import notificationRoutes from './routes/notification.routes';
import campusVieRoutes from './routes/campusvie.routes';
import opportuniteRoutes from './routes/opportunite.routes';
import settingsRoutes from './routes/settings.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();


const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé.');
}



// Origines autorisées (front Vite en dev sur 5173, + variable d'env pour la prod).
const origines = [
  process.env.CORS_API_URL_FRONTEND || 'http://localhost:5173',
  'http://localhost:8080',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({ origin: origines, credentials: true }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.get('/', (_req: Request, res: Response) => {
  res.send('CampusLink API est opérationnelle !');
});

app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/matieres', matiereRoutes);
app.use('/api/commentaires', commentaireRoutes);
app.use('/api/entraide', entraideRoutes);
app.use('/api/projets', projetRoutes);

app.use('/api/campus-vie', campusVieRoutes);
app.use('/api/opportunites', opportuniteRoutes);
app.use('/api', academiqueRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/admin', adminRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route introuvable' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur CampusLink démarré sur le port ${PORT}`));

