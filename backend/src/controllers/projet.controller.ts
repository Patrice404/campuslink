import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

const ENTRAIDE_LEVEL_RANKS: Record<string, number> = {
    '1A': 1, '2A': 2, '3A': 3, '4A': 4, '5A': 5
};

export async function getProjets(req: Request, res: Response): Promise<void> {
    try {
        const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;

        // 1. GESTION DE LA PAGINATION
        const LIMIT = 10; // Nombre d'annonces par page
        const queryPage = Number(req.query.page);

        // Si la page est absente, négative ou n'est pas un nombre, on force la page 1
        const page = !isNaN(queryPage) && queryPage > 0 ? queryPage : 1;
        const skip = (page - 1) * LIMIT;

        let excludedUserIds: bigint[] = [];
        let allowedVisibilities: string[] = ['PUBLIQUE'];
        let userFormationId: bigint | null = null;
        let allowedAuthorNiveaux: string[] = [];

        // 2. Extraction des règles de sécurité (Blocages et Visibilité)
        if (idConnected) {
            const blocages = await prisma.blocage.findMany({
                where: {
                    OR: [
                        { id_utilisateur_bloquant: idConnected },
                        { id_utilisateur_bloque: idConnected }
                    ]
                },
                select: { id_utilisateur_bloquant: true, id_utilisateur_bloque: true }
            });

            const excludedSet = new Set<bigint>();
            blocages.forEach(b => {
                if (b.id_utilisateur_bloquant !== idConnected) excludedSet.add(b.id_utilisateur_bloquant);
                if (b.id_utilisateur_bloque !== idConnected) excludedSet.add(b.id_utilisateur_bloque);
            });
            excludedUserIds = Array.from(excludedSet);

            const infoUtilisateur = await prisma.utilisateur.findUnique({
                where: { id: idConnected },
                include: { formation: true }
            });

            if (infoUtilisateur) {
                userFormationId = infoUtilisateur.id_formation;
                allowedVisibilities.push(infoUtilisateur.role);

                if (infoUtilisateur.formation) {
                    const currentNiveau = infoUtilisateur.formation.niveau;
                    const currentRank = ENTRAIDE_LEVEL_RANKS[currentNiveau] || 0;
                    allowedAuthorNiveaux = Object.keys(ENTRAIDE_LEVEL_RANKS).filter(
                        niv => ENTRAIDE_LEVEL_RANKS[niv] <= currentRank
                    );
                }
            }
        }

        const projetsVisibilityWhere = {
            id_utilisateur: { notIn: excludedUserIds },
            OR: [
                ...(idConnected ? [{ id_utilisateur: idConnected }] : []),
                { visibilite: { in: allowedVisibilities as any } },
                ...(userFormationId ? [{
                    AND: [
                        { visibilite: 'PROMOTION' as const },
                        { utilisateur: { id_formation: userFormationId } }
                    ]
                }] : []),
                ...(allowedAuthorNiveaux.length > 0 ? [{
                    AND: [
                        { visibilite: 'PROMO_SUPERIEUR' as const },
                        { utilisateur: { formation: { niveau: { in: allowedAuthorNiveaux } } } }
                    ]
                }] : [])
            ]
        };

        // 3. REQUÊTE AVEC SKIP ET TAKE
        const projets = await prisma.annonceProjet.findMany({
            where: projetsVisibilityWhere,
            include: {
                utilisateur: {
                    select: { id: true, nom: true, prenom: true, photoProfil: true, role: true }
                }
            },
            orderBy: { datePublication: 'desc' },
            skip: skip,  // Saute les annonces des pages précédentes
            take: LIMIT  // Récupère uniquement les 25 suivantes
        });

        // 4. Sérialisation des BigInt
        const deepSerializeBigInt = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;

            // ⚡️ LA CORRECTION SÉCURITÉ : Si c'est une Date, on la renvoie telle quelle sans la casser
            if (obj instanceof Date) return obj;

            if (Array.isArray(obj)) return obj.map(deepSerializeBigInt);

            const newObj = { ...obj };
            for (const key in newObj) {
                if (typeof newObj[key] === 'bigint') {
                    newObj[key] = newObj[key].toString();
                } else if (typeof newObj[key] === 'object') {
                    newObj[key] = deepSerializeBigInt(newObj[key]);
                }
            }
            return newObj;
        };

        res.status(200).json(deepSerializeBigInt(projets));

    } catch (error) {
        console.error("Erreur dans getProjets avec pagination :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des projets." });
    }
}