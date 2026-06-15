// --- ENUMS (Types Énumérés) ---

export enum Role {
  ETUDIANT = 'ETUDIANT',
  PROFESSEUR = 'PROFESSEUR'
}

export enum TypeAnnonce {
  EXERCICE = 'EXERCICE',
  BON_PLAN = 'BON_PLAN',
  TUTORAT = 'TUTORAT',
  PROJET = 'PROJET'
}

export enum StatutCandidature {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTEE = 'ACCEPTEE',
  REFUSEE = 'REFUSEE'
}

export enum SousTypeBonPlan {
  JOB_ETUDIANT = 'JOB_ETUDIANT',
  ALTERNANCE = 'ALTERNANCE',
  COLOCATION = 'COLOCATION',
  FETE = 'FETE',
  EVENEMENT = 'EVENEMENT',
  RESTAURANT = 'RESTAURANT',
  BOURSE = 'BOURSE',
  HACKATHON = 'HACKATHON'
}

// --- MODÈLES DE BASE ---

export interface Campus {
  id: string | number; // Remplacement de BigInt
  nom: string;
  ville: string;
  etablissement: string;
  // Relations optionnelles (pour les requêtes Prisma avec 'include')
  utilisateurs?: Utilisateur[];
}

export interface Matiere {
  id: string | number;
  titre: string;
  annee: string;
  annoncesExercice?: AnnonceExercice[];
  annoncesTutorat?: AnnonceTutorat[];
}

export interface Utilisateur {
  id: string | number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string; // Attention : idéalement, ne pas exposer côté frontend
  role: Role;
  dateInscription: Date | string;
  photoProfil?: string | null;
  id_campus?: string | number | null;
  
  // Relations
  campus?: Campus | null;
  notifications?: Notification[];
  commentaires?: Commentaire[];
  jaimes?: Jaime[];
  annoncesExercice?: AnnonceExercice[];
  annoncesBonPlan?: AnnonceBonPlan[];
  annoncesTutorat?: AnnonceTutorat[];
  annoncesProjet?: AnnonceProjet[];
}

export interface Notification {
  id: string | number;
  contenu: string;
  dateCreation: Date | string;
  lue: boolean;
  id_utilisateur: string | number;
  
  // Relation
  utilisateur?: Utilisateur;
}

// --- HÉRITAGE DES ANNONCES ---

export interface AnnonceExercice {
  id: string | number;
  type: TypeAnnonce; // Devrait toujours être 'EXERCICE'
  datePublication: Date | string;
  nbJaime: number;
  image?: string | null;
  lien?: string | null;
  annee: string;
  texte: string;
  id_utilisateur: string | number;
  id_matiere: string | number;
  
  // Relations
  utilisateur?: Utilisateur;
  matiere?: Matiere;
  commentaires?: Commentaire[];
  jaimes?: Jaime[];
}

export interface AnnonceBonPlan {
  id: string | number;
  type: TypeAnnonce; // Devrait toujours être 'BON_PLAN'
  datePublication: Date | string;
  nbJaime: number;
  image?: string | null;
  lien?: string | null;
  titre: string;
  texte: string;
  sousType: SousTypeBonPlan;
  id_utilisateur: string | number;
  
  // Relations
  utilisateur?: Utilisateur;
  commentaires?: Commentaire[];
  jaimes?: Jaime[];
}

export interface AnnonceTutorat {
  id: string | number;
  type: TypeAnnonce; // Devrait toujours être 'TUTORAT'
  datePublication: Date | string;
  nbJaime: number;
  image?: string | null;
  lien?: string | null;
  nbCandidatsVoulus: number;
  annee: string;
  description: string;
  id_utilisateur: string | number;
  id_matiere: string | number;
  
  // Relations
  utilisateur?: Utilisateur;
  matiere?: Matiere;
  commentaires?: Commentaire[];
  jaimes?: Jaime[];
  candidatures?: Candidature[];
}

export interface AnnonceProjet {
  id: string | number;
  type: TypeAnnonce; // Devrait toujours être 'PROJET'
  datePublication: Date | string;
  nbJaime: number;
  image?: string | null;
  lien?: string | null;
  titre: string;
  texte: string;
  description: string;
  id_utilisateur: string | number;
  
  // Relations
  utilisateur?: Utilisateur;
  commentaires?: Commentaire[];
  jaimes?: Jaime[];
}

// --- RELATIONS COMPLEXES ---

export interface Commentaire {
  id: string | number;
  texte: string;
  dateCreation: Date | string;
  id_utilisateur: string | number;
  id_exercice?: string | number | null;
  id_bonplan?: string | number | null;
  id_tutorat?: string | number | null;
  id_projet?: string | number | null;
  
  // Relations
  utilisateur?: Utilisateur;
  exercice?: AnnonceExercice | null;
  bonplan?: AnnonceBonPlan | null;
  tutorat?: AnnonceTutorat | null;
  projet?: AnnonceProjet | null;
}

export interface Jaime {
  id: string | number;
  date: Date | string;
  id_utilisateur: string | number;
  id_exercice?: string | number | null;
  id_bonplan?: string | number | null;
  id_tutorat?: string | number | null;
  id_projet?: string | number | null;
  
  // Relations
  utilisateur?: Utilisateur;
  exercice?: AnnonceExercice | null;
  bonplan?: AnnonceBonPlan | null;
  tutorat?: AnnonceTutorat | null;
  projet?: AnnonceProjet | null;
}

export interface Candidature {
  id: string | number;
  statut: StatutCandidature;
  datePostulation: Date | string;
  messageMotivation: string;
  id_tutorat: string | number;
  
  // Relation
  tutorat?: AnnonceTutorat;
}