import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';

// Fonction pour générer une URL sécurisée lisible par le Front
export async function genererUrlSignee(blobUrlBrute: string | null): Promise<string | null> {
  if (!blobUrlBrute) return null;
  
  try {
    // Si l'image n'est pas sur Azure Blob (ex: url locale ou vide), on la retourne telle quelle
    if (!blobUrlBrute.includes('blob.core.windows.net')) return blobUrlBrute;

    const urlParts = blobUrlBrute.split('/');
    const blobName = urlParts[urlParts.length - 1];
    const containerName = 'campuslink-uploads';

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    // Le lien généré sera valide pendant 2 heures pour la session de l'utilisateur
    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 2); 

    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"), // Lecture seule
      expiresOn,
    }, blobServiceClient.credential as StorageSharedKeyCredential).toString();

    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error("Erreur lors de la génération du jeton SAS, retour à l'URL brute:", error);
    return blobUrlBrute;
  }
}