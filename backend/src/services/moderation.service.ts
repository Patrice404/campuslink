import { Request } from 'express';

/**
 * Service de modération automatique utilisant l'IA locale (Ollama)
 * Analyse sémantiquement le contenu pour y déceler l'intention (Insultes, obscénités, arnaques)
 */
export async function verifierContenuAvecIA(description: string, titre?: string, lien?: string): Promise<'SAFE' | 'REJECT'> {
    try {
        const urlOllama = process.env.OLLAMA_URL || 'http://ai-moderation:11434';
        const modeleOllama = process.env.OLLAMA_MODEL || 'llama3.2:3b';

        let contenuAAnalyser = titre
            ? `Titre: "${titre}". Description: "${description}"`
            : `Description: "${description}"`;
        if (lien) {
            contenuAAnalyser += ` Lien: "${lien}"`;
        }

        // Prompt d'investigation sémantique (Rédigé en anglais pour maximiser l'efficacité de Phi-3)
        const prompt = `You are an expert Content Policy Inspector for a university student platform.
    Your task is to perform a semantic investigation on the following student post written in French.
    Do not just match keywords. Evaluate the underlying intent, meaning, and appropriateness.

    CRITERIA TO "REJECT" THE POST:
    1. Profanity & Vulgarity: Explicit or implicit insults, French slurs, vulgar anatomical or sexual terms, harassment, or aggressive behavior.
    2. Adult Content: Inappropriate sexual references, pornography, or dating-like behavior unsuitable for an academic environment.
    3. Scams & Malicious Activity: Spam, phishing, suspicious links, cryptocurrency promotions, or shady homework-cheating offers.

    POST TO ANALYZE:
    ---
    ${contenuAAnalyser}
    ---

    FINAL INSTRUCTION:
    If the post violates ANY criteria above by text or implication, reply strictly with "REJECT".
    If the post is fully safe, normal, and appropriate for university students, reply strictly with "SAFE".
    Do not add any explanation, thoughts, or punctuation. Output one word only.`;

        const response = await fetch(`${urlOllama}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modeleOllama,
                prompt: prompt,
                stream: false,
                options: {
                    // ⚡️ CRUCIAL : Force l'IA à être purement logique et déterministe (pas de hasard)
                    temperature: 0.0,
                    top_p: 0.1
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur de communication avec Ollama (Status: ${response.status})`);
        }

        const data = await response.json();
        const reponseIA = data.response.trim().toUpperCase();

        // ⚡️ AJOUTE CES LOGS ICI POUR SQUEEZER L'IA :
        console.log("---------------- MODÉRATION IA ----------------");
        console.log("📝 CONTEXTE ANALYSÉ :", contenuAAnalyser);
        console.log("🤖 RÉPONSE BRUTE DE L'IA :", `"${reponseIA}"`);
        console.log("-----------------------------------------------");

        // Analyse de la réponse
        return reponseIA.includes('REJECT') ? 'REJECT' : 'SAFE';

    } catch (error) {
        console.error("Échec de la modération automatique (IA locale) :", error);
        return 'SAFE'; // Sécurité par défaut
    }
}