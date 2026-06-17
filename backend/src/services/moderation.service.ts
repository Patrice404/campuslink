import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const apiKey = process.env.OPENAI_API_KEY || '';
const client = new OpenAI({ apiKey });

/**
 * Lit une image depuis le disque et la convertit en base64
 */
function imageFileToBase64(filename: string): { base64: string; mimeType: string } | null {
    try {
        const imagePath = path.join(process.cwd(), 'uploads', filename);
        if (!fs.existsSync(imagePath)) {
            console.warn(`Image introuvable sur le disque : ${imagePath}`);
            return null;
        }
        const buffer = fs.readFileSync(imagePath);
        const base64 = buffer.toString('base64');
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.jpg':  'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png':  'image/png',
            '.gif':  'image/gif',
            '.webp': 'image/webp'
        };
        const mimeType = mimeTypes[ext] || 'image/jpeg';
        return { base64, mimeType };
    } catch (err) {
        console.error("Erreur lors de la lecture de l'image:", err);
        return null;
    }
}

/**
 * Service de modération automatique utilisant OpenAI GPT-4o
 * Analyse texte ET images (lues depuis le disque du container)
 */
export async function verifierContenuAvecIA(
    description: string,
    titre?: string,
    lien?: string,
    imageFilenames?: string[] // 👈 noms de fichiers ex: ['photo.jpg']
): Promise<'SAFE' | 'REJECT'> {
    try {
        if (!apiKey) {
            console.warn("OpenAI n'est pas configuré. Passage en SAFE par défaut.");
            return 'SAFE';
        }

        let contenuAAnalyser = titre
            ? `Titre: "${titre}". Description: "${description}"`
            : `Description: "${description}"`;
        if (lien) {
            contenuAAnalyser += ` Lien: "${lien}"`;
        }

        const systemPrompt = `You are an expert Content Policy Inspector for a university student platform.
    Your task is to perform a semantic investigation on the following student post written in French.
    This post may contain text and/or images. Analyze ALL provided content together.
    Do not just match keywords. Evaluate the underlying intent, meaning, and appropriateness.

    CRITERIA TO "REJECT" THE POST:
    1. Profanity & Vulgarity: Explicit or implicit insults, French slurs, vulgar anatomical or sexual terms, harassment, or aggressive behavior.
    2. Adult Content: Inappropriate sexual references, pornography, or dating-like behavior unsuitable for an academic environment.
    3. Scams & Malicious Activity: Spam, phishing, suspicious links, cryptocurrency promotions, or shady homework-cheating offers.
    4. Hate Speech & Discrimination: Racist, sexist, homophobic, or discriminatory content targeting any group or individual.
    5. Allow companies, brands, or products only if they are relevant to the academic context and do not promote commercial interests.
    6. Companies site links are allowed, github and coworking spaces.
    7. Images: Reject any image containing nudity, violence, gore, hate symbols, or inappropriate content for a university platform.`;

        // Construction du message avec texte
        const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
            {
                type: 'text',
                text: `POST TO ANALYZE:\n---\n${contenuAAnalyser}\n---`
            }
        ];

        // Ajout des images en base64 depuis le disque
        let hasImages = false;
        if (imageFilenames && imageFilenames.length > 0) {
            for (const filename of imageFilenames) {
                const imageData = imageFileToBase64(filename);
                if (imageData) {
                    userContent.push({
                        type: 'image_url',
                        image_url: {
                            url: `data:${imageData.mimeType};base64,${imageData.base64}`,
                            detail: 'low' // suffit pour la modération, moins cher
                        }
                    });
                    hasImages = true;
                }
            }
        }

        userContent.push({
            type: 'text',
            text: `FINAL INSTRUCTION:
    If the post or ANY image violates ANY criteria above, reply strictly with "REJECT".
    If everything is fully safe and appropriate for university students, reply strictly with "SAFE".
    Do not add any explanation, thoughts, or punctuation. Output one word only.`
        });

        const response = await client.chat.completions.create({
            model: hasImages ? 'gpt-4o' : 'gpt-4o-mini', // GPT-4o seulement si images
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            temperature: 0.0,
            top_p: 0.1,
            max_tokens: 5
        });

        const reponseIA = (response.choices[0]?.message?.content || '').trim().toUpperCase();

        console.log("---------------- MODÉRATION IA (OPENAI) ----------------");
        console.log("📝 CONTEXTE ANALYSÉ :", contenuAAnalyser);
        console.log("🖼️  IMAGES ANALYSÉES :", hasImages ? imageFilenames?.length : 0);
        console.log("🤖 RÉPONSE BRUTE DE L'IA :", `"${reponseIA}"`);
        console.log("-------------------------------------------------------");

        return reponseIA.includes('REJECT') ? 'REJECT' : 'SAFE';

    } catch (error) {
        console.error("Échec de la modération automatique (OpenAI) :", error);
        return 'REJECT';
    }
}