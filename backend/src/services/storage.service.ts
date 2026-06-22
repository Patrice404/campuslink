import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(__dirname, '../../uploads');

/**
 * Upload un fichier vers le dossier local /uploads
 * Retourne l'URL publique complète pour usage front
 */
export async function uploadImageToBlob(file: Express.Multer.File): Promise<string> {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const rawExtension = path.extname(file.originalname).toLowerCase();
  const cleanExtension = rawExtension.replace(/[^\w.-]/g, '');

  const timestamp = Date.now();
  const fileName = `profil-${timestamp}${cleanExtension}`;
  const filePath = path.join(uploadsDir, fileName);

  fs.writeFileSync(filePath, file.buffer);

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const publicUrl = `${baseUrl}/uploads/${fileName}`;

  console.log(`Image enregistrée localement : ${publicUrl}`);
  return publicUrl;
}

/**
 * Supprime une image depuis le dossier local /uploads
 */
export async function deleteImageFromBlob(imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl);
    const fileName = path.basename(url.pathname);
    const filePath = path.join(uploadsDir, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Image supprimée localement : ${fileName}`);
    } else {
      console.warn(`⚠️ Fichier introuvable : ${filePath}`);
    }
  } catch (err) {
    console.error('Erreur suppression locale:', err);
  }
}