import {
    // --- ENUMS ---
    Role,
    TypeAnnonce,
    StatutCandidature,
    SousTypeBonPlan,
    CentreInteret,
    Visibilite,

    // --- MODÈLES ---
    Campus,
    Departement,
    Formation,
    Utilisateur,
    Blocage,
    AnnonceExercice,
    AnnonceBonPlan,
    AnnonceTutorat,
    AnnonceProjet,
    Matiere,
    Notification,
    Commentaire,
    Jaime,
    Candidature,
    VerificationEmail,

  // --- NAMESPACE PRISMA (Optionnel, utile pour les types avancés) ---
  Prisma
} from '@prisma/client';
    
// 1. Export des Enums (Ce sont des objets utilisables au runtime en JS/TS)
export {
  Role,
  TypeAnnonce,
  StatutCandidature,
  SousTypeBonPlan,
  CentreInteret,
  Visibilite,
};

// 2. Export des Modèles (Ce sont uniquement des Types TS)
export type {
  Campus,
  Departement,
  Formation,
  Utilisateur,
  Blocage,
  AnnonceExercice,
  AnnonceBonPlan,
  AnnonceTutorat,
  AnnonceProjet,
  Matiere,
  Notification,
  Commentaire,
  Jaime,
  Candidature,
  VerificationEmail,
  
  // Export du namespace pour pouvoir utiliser Prisma.UtilisateurGetPayload par exemple
  Prisma 
};