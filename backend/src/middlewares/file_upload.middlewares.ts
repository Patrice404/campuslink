import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// 1. Filtre pour vérifier le format
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('FORMAT_INVALIDE'));
    }
};

// 2. memoryStorage : le fichier reste en RAM, pas sur le disque
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
    fileFilter: fileFilter
});

// 3. Middleware encapsulé avec gestion d'erreurs
export const uploadImageMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = upload.single('image');
    uploadSingle(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "L'image est trop volumineuse (maximum 5 Mo)." });
            }
            return res.status(400).json({ message: `Erreur d'upload : ${err.message}` });
        } else if (err) {
            if (err.message === 'FORMAT_INVALIDE') {
                return res.status(400).json({ message: 'Format non supporté. Veuillez envoyer une image (JPEG, PNG, WEBP, GIF).' });
            }
            return res.status(500).json({ message: "Une erreur inconnue est survenue lors du traitement de l'image." });
        }
        next();
    });
};