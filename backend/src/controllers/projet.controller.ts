import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

const ENTRAIDE_LEVEL_RANKS: Record<string, number> = {
    '1A': 1, '2A': 2, '3A': 3, '4A': 4, '5A': 5
};

export async function getProjets(req: Request, res: Response): Promise<void> {
    try {
        const idConnected = req.utilisateur ? BigInt(req.utilisateur.id) : null;

        // 1. GESTION DE LA PAGINATION
        const LIMIT = 4; // Nombre d'annonces par page
        const queryPage = Number(req.query.page);

        // Si la page est absente, négative ou n'est pas un nombre, on force la page 1
        const page = !isNaN(queryPage) && queryPage > 0 ? queryPage : 1;
        const skip = (page - 1) * LIMIT;

        let excludedUserIds: bigint[] = [];
        let allowedVisibilities: string[] = ['PUBLIQUE'];
        let userFormationId: bigint | null = null;
        let allowedAuthorNiveaux: string[] = [];
        let isAdminUser = false; // ✨ Drapeau pour repérer l'admin

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
                
                // ✨ Protection : On isole le rôle ADMIN pour ne pas faire cracher Prisma
                if (infoUtilisateur.role === 'ADMIN') {
                    isAdminUser = true;
                } else if (infoUtilisateur.role) {
                    allowedVisibilities.push(infoUtilisateur.role);
                }

                if (infoUtilisateur.formation) {
                    const currentNiveau = infoUtilisateur.formation.niveau;
                    const currentRank = ENTRAIDE_LEVEL_RANKS[currentNiveau] || 0;
                    allowedAuthorNiveaux = Object.keys(ENTRAIDE_LEVEL_RANKS).filter(
                        niv => ENTRAIDE_LEVEL_RANKS[niv] <= currentRank
                    );
                }
            }
        }

        // Configuration de la visibilité générique
        const projetsVisibilityWhere: any = {
            id_utilisateur: { notIn: excludedUserIds },
        };

        // ✨ Si c'est un utilisateur normal, on applique les restrictions de visibilité
        if (!isAdminUser) {
            projetsVisibilityWhere.OR = [
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
            ];
        }

        // 3. REQUÊTE AVEC SKIP, TAKE ET LA COUCHE DE LIKE INTÉGRÉE
        const projets = await prisma.annonceProjet.findMany({
            where: projetsVisibilityWhere,
            include: {
                utilisateur: {
                    select: { id: true, uuid: true, nom: true, prenom: true, photoProfil: true, role: true }
                },
                jaimes: true // <--- AJOUT CRITIQUE : On inclut les likes du projet !
            },
            orderBy: { datePublication: 'desc' },
            skip: skip,  
            take: LIMIT  
        });

        // 4. FORMATAGE ET CALCUL EN CONTINU DE "isLikedByMe"
        const formatProjets = projets.map(proj => {
            const jaimesArray = proj.jaimes || [];
            
            // On vérifie si l'utilisateur actuellement connecté fait partie du tableau des likes
            const isLikedByMe = idConnected
                ? jaimesArray.some((j: any) => BigInt(j.id_utilisateur) === idConnected)
                : false;

            return {
                ...proj,
                nbJaime: proj.nbJaime || 0,
                isLikedByMe // Injection de la propriété booléenne attendue par le Front
            };
        });

        // 5. Sérialisation des BigInt (Ton utilitaire indispensable)
        const deepSerializeBigInt = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;

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

        // Renvoyer les données formatées et sérialisées
        res.status(200).json(deepSerializeBigInt(formatProjets));

    } catch (error) {
        console.error("Erreur dans getProjets avec pagination :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des projets." });
    }
}