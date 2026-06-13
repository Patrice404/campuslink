import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users';

const app = express();
app.use(cors()); // Autorise le frontend à appeler l'API
app.use(express.json()); // Permet d'analyser le JSON envoyé par le client

// Tes routes
app.use('/api', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));