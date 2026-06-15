require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/campus', require('./routes/campus.routes'));
app.use('/api/annonces', require('./routes/annonce.routes'));
app.use('/api/commentaires', require('./routes/commentaire.routes'));
app.use('/api/candidatures', require('./routes/candidature.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/utilisateurs', require('./routes/utilisateur.routes'));
app.use('/api/hashtags', require('./routes/hashtag.routes'));
app.use('/api/matieres', require('./routes/matiere.routes'));

app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur CampusLNK démarré sur le port ${PORT}`));
