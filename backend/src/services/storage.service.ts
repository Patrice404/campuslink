import { BlobServiceClient } from '@azure/storage-blob';
import path from 'path';
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'campuslink-uploads';

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Upload un fichier vers Azure Blob Storage
 * Retourne l'URL publique permanente
 */
export async function uploadImageToBlob(file: Express.Multer.File): Promise<string> {
    const rawExtension = path.extname(file.originalname).toLowerCase();
    const cleanExtension = rawExtension.replace(/[^\w.-]/g, ''); 

    // Générer le nom ultra-propre : profil-[uuid]-[timestamp].[extension]
    const timestamp = Date.now();
    const blobName = `profil-${timestamp}${cleanExtension}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    console.log(`Image uploadée avec format sécurisé vers Blob : ${blockBlobClient.url}`);
    return blockBlobClient.url;
}

/**
 * Supprime une image depuis Azure Blob Storage
 */
export async function deleteImageFromBlob(imageUrl: string): Promise<void> {
    try {
        // Extrait le nom du blob depuis l'URL
        const url = new URL(imageUrl);
        const blobName = url.pathname.split('/').slice(2).join('/');
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
        console.log(`🗑️ Image supprimée du Blob : ${blobName}`);
    } catch (err) {
        console.error("Erreur suppression Blob:", err);
    }
}