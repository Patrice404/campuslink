import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// S'assurer que le dossier existe
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. Filtre pour vérifier le format
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Liste des types MIME autorisés (correspond à ce que tu as mis dans ton accept="" en HTML)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Le fichier est accepté
  } else {
    // Le fichier est rejeté avec un message d'erreur personnalisé
    cb(new Error('FORMAT_INVALIDE'));
  }
};

// 3. L'instance Multer de base
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite stricte de 5 Mo
  fileFilter: fileFilter
});

// 4. L'encapsuleur pour intercepter et formater les erreurs
export const uploadImageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // On exécute Multer manuellement ici au lieu de le passer directement dans les routes
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Erreur native de Multer (ex: dépassement de taille)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'L\'image est trop volumineuse (maximum 5 Mo).' });
      }
      return res.status(400).json({ message: `Erreur d'upload : ${err.message}` });
    } else if (err) {
      // Erreur personnalisée jetée par notre fileFilter
      if (err.message === 'FORMAT_INVALIDE') {
        return res.status(400).json({ message: 'Format non supporté. Veuillez envoyer une image (JPEG, PNG, WEBP, GIF).' });
      }
      return res.status(500).json({ message: 'Une erreur inconnue est survenue lors du traitement de l\'image.' });
    }
    next();
  });
};