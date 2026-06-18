import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';
const client = new OpenAI({ apiKey });

export async function verifierContenuAvecIA(
    description: string,
    titre?: string,
    lien?: string,
    imageUrls?: string[] // URLs publiques Blob Azure
): Promise<'SAFE' | 'REJECT'> {
    try {
        if (!apiKey) {
            console.warn("OpenAI n'est pas configuré. Passage en SAFE par défaut.");
            return 'SAFE';
        }

        let contenuAAnalyser = titre
            ? `Titre: "${titre}". Description: "${description}"`
            : `Description: "${description}"`;
        if (lien) contenuAAnalyser += ` Lien: "${lien}"`;

        const systemPrompt = `You are a content moderator for a French university campus platform. Your role is to protect students from genuinely harmful content, NOT to censor legitimate academic, social, or professional discussions.

CORE PRINCIPLE: Analyze the CONTEXT and INTENT, not individual words or topics. A word or name that seems sensitive may be perfectly appropriate in context. Be PERMISSIVE by default — only reject content that is clearly and unambiguously harmful.

REJECT ONLY IF the content contains:
1. Racism, xenophobia, antisemitism, or discrimination targeting any ethnic, religious, or national group.
2. Homophobia, transphobia, or discrimination based on gender or sexual orientation.
3. Targeted harassment or personal attacks intended to intimidate or demean a specific individual.
4. Explicit sexual or pornographic content.
5. Content that is manifestly illegal or incites violence against a person or group.

ALWAYS ALLOW (never reject for these reasons):
- Mentions of politicians, presidents, historical figures, or public personalities, even in a critical or debated context.
- Company names, startups, brands, or professional references.
- Spelling mistakes, grammar errors, or informal French writing.
- Opinions, debates, and disagreements, even strong ones, as long as they do not target a group with hatred.
- Academic discussions on sensitive historical or social topics (colonialism, wars, discrimination, etc.).
- Frustration or mild vulgarity that is not directed at a person or group.

CONTEXT NOTE: The content you receive may include a student post followed by a comment being moderated. Analyze the full context together to understand the real meaning and intent before making a decision.

FINAL INSTRUCTION: Reply strictly with "REJECT" only if the content clearly violates the criteria above. If there is any doubt, reply "SAFE". Output one word only, no explanation.`;

        const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
            {
                type: 'text',
                text: `POST TO ANALYZE:\n---\n${contenuAAnalyser}\n---`
            }
        ];

        // Ajout des images via URL publique Blob
        let hasImages = false;
        if (imageUrls && imageUrls.length > 0) {
            for (const url of imageUrls) {
                userContent.push({
                    type: 'image_url',
                    image_url: { url, detail: 'low' }
                });
                hasImages = true;
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
            model: hasImages ? 'gpt-4o' : 'gpt-4o-mini',
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
        console.log("🖼️  IMAGES ANALYSÉES :", imageUrls?.length || 0);
        console.log("🤖 RÉPONSE BRUTE DE L'IA :", `"${reponseIA}"`);
        console.log("-------------------------------------------------------");

        return reponseIA.includes('REJECT') ? 'REJECT' : 'SAFE';

    } catch (error) {
        console.error("Échec de la modération automatique (OpenAI) :", error);
        return 'REJECT';
    }
}