export type Role = 'ETUDIANT' | 'PROFESSEUR' | 'ADMIN';

export type TypeAnnonce = 'EXERCICE' | 'BON_PLAN' | 'TUTORAT' | 'PROJET';

export type StatutCandidature = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export type SousTypeBonPlan = 
  | 'JOB_ETUDIANT' 
  | 'ALTERNANCE' 
  | 'COLOCATION' 
  | 'FETE' 
  | 'EVENEMENT' 
  | 'RESTAURANT' 
  | 'BOURSE' 
  | 'HACKATHON';

export type CentreInteret = 'PROJET' | 'EXERCICE' | 'BON_PLAN' | 'ENTRAIDE' | 'MATIERE';

export type Visibilite = 'PUBLIQUE' | 'PROMOTION' | 'PROFESSEUR' | 'ETUDIANT' | 'PROMO_SUPERIEUR';

export interface Campus {
  id: number;
  nom: string;
  ville: string;
  etablissement: string;
}

export interface Departement {
  id: number;
  nom: string;
  id_campus: number;
}

export interface Formation {
  id: number;
  nom: string;
  niveau: string;
  id_departement: number;
}

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: Role;
  dateInscription: Date | string;
  photoProfil: string | null;
  centresInteret: CentreInteret[];
  bio: string | null;
  id_formation: number | null;
}

export interface Blocage {
  id_utilisateur_bloquant: number;
  id_utilisateur_bloque: number;
  dateCreation: Date | string;
}

export interface AnnonceExercice {
  id: number;
  type: TypeAnnonce; // 'EXERCICE'
  visibilite: Visibilite;
  datePublication: Date | string;
  nbJaime: number;
  image: string | null;
  lien: string | null;
  annee: string;
  description: string;
  id_utilisateur: number;
  id_matiere: number;
}

export interface AnnonceBonPlan {
  id: number;
  type: TypeAnnonce; // 'BON_PLAN'
  visibilite: Visibilite;
  datePublication: Date | string;
  nbJaime: number;
  image: string | null;
  lien: string | null;
  titre: string;
  description: string;
  sousType: SousTypeBonPlan;
  id_utilisateur: number;
}

export interface AnnonceTutorat {
  id: number;
  type: TypeAnnonce; // 'TUTORAT'
  visibilite: Visibilite;
  datePublication: Date | string;
  nbJaime: number;
  nbCandidatsVoulus: number;
  description: string;
  image: string | null;
  lien: string | null;
  annee: string;
  id_utilisateur: number;
  id_matiere: number;
}

export interface AnnonceProjet {
  id: number;
  type: TypeAnnonce; // 'PROJET'
  visibilite: Visibilite;
  datePublication: Date | string;
  nbJaime: number;
  titre: string;
  lien: string | null;
  image: string | null;
  description: string;
  id_utilisateur: number;
}

export interface Matiere {
  id: number;
  titre: string;
}

export interface Notification {
  id: number;
  contenu: string;
  dateCreation: Date | string;
  lue: boolean;
  lien: string | null;
  id_utilisateur: number;
}

export interface Commentaire {
  id: number;
  texte: string;
  dateCreation: Date | string;
  id_utilisateur: number;
  id_exercice: number | null;
  id_bonplan: number | null;
  id_tutorat: number | null;
  id_projet: number | null;
  id_parent: number | null;
}

export interface Jaime {
  id: number;
  date: Date | string;
  id_utilisateur: number;
  id_exercice: number | null;
  id_bonplan: number | null;
  id_tutorat: number | null;
  id_projet: number | null;
}

export interface Candidature {
  id: number;
  statut: StatutCandidature;
  date: Date | string;
  messageMotivation: string;
  id_tutorat: number;
}

export interface VerificationEmail {
  id: number;
  email: string;
  code: string;
  expiration: Date | string;
  nom: string;
  prenom: string;
  motDePasse: string;
  role: Role;
  id_formation: number | null;
}

// Un utilisateur complet avec les détails de sa formation
export interface UtilisateurAvecRelations extends Utilisateur {
  formation?: Formation | null;
}

// Un commentaire incluant l'auteur et ses réponses éventuelles
export interface CommentaireAvecRelations extends Commentaire {
  utilisateur: Utilisateur;
  reponses?: CommentaireAvecRelations[];
}

// Une annonce générique typée pour l'affichage de flux d'actualités
export interface AnnonceExerciceAvecRelations extends AnnonceExercice {
  utilisateur: Utilisateur;
  matiere: Matiere;
  commentaires?: Commentaire[];
  jaimes?: Jaime[];
}