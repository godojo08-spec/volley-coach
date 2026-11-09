// src/mockPlayers.js

export const mockPlayers = [
  // Passeurs
  { id: 'm1', prenom: 'Léo', nom: 'Passe', posteEquipe: 'Passeur', stats: { attaque: 4, reception: 5, passe: 9, bloc: 6, defense: 7, service: 8 } },
  { id: 'm2', prenom: 'Hugo', nom: 'Caviar', posteEquipe: 'Passeur', stats: { attaque: 3, reception: 6, passe: 8, bloc: 5, defense: 8, service: 7 } },
  
  // Pointus
  { id: 'm3', prenom: 'Marc', nom: 'Marteau', posteEquipe: 'Pointu', stats: { attaque: 9, reception: 2, passe: 3, bloc: 7, defense: 6, service: 9 } },
  { id: 'm4', prenom: 'Tom', nom: 'Foudre', posteEquipe: 'Pointu', stats: { attaque: 8, reception: 3, passe: 4, bloc: 6, defense: 5, service: 8 } },
  
  // R4 (Réceptionneurs-Attaquants)
  { id: 'm5', prenom: 'Paul', nom: 'Complet', posteEquipe: 'Réceptionneur-Attaquant (R4)', stats: { attaque: 8, reception: 8, passe: 5, bloc: 6, defense: 7, service: 7 } },
  { id: 'm6', prenom: 'Jean', nom: 'Stabilité', posteEquipe: 'Réceptionneur-Attaquant (R4)', stats: { attaque: 6, reception: 9, passe: 6, bloc: 5, defense: 8, service: 6 } },
  { id: 'm7', prenom: 'Luc', nom: 'Frappeur', posteEquipe: 'Réceptionneur-Attaquant (R4)', stats: { attaque: 9, reception: 6, passe: 4, bloc: 7, defense: 5, service: 8 } },
  { id: 'm8', prenom: 'Max', nom: 'Saut', posteEquipe: 'Réceptionneur-Attaquant (R4)', stats: { attaque: 7, reception: 7, passe: 5, bloc: 6, defense: 6, service: 7 } },
  
  // Centraux
  { id: 'm9', prenom: 'Alex', nom: 'Mur', posteEquipe: 'Central', stats: { attaque: 7, reception: 1, passe: 2, bloc: 9, defense: 3, service: 5 } },
  { id: 'm10', prenom: 'David', nom: 'Rapide', posteEquipe: 'Central', stats: { attaque: 8, reception: 2, passe: 3, bloc: 8, defense: 4, service: 6 } },
  { id: 'm11', prenom: 'Sam', nom: 'Géant', posteEquipe: 'Central', stats: { attaque: 6, reception: 1, passe: 2, bloc: 9, defense: 2, service: 4 } },
  { id: 'm12', prenom: 'Nils', nom: 'Timing', posteEquipe: 'Central', stats: { attaque: 7, reception: 2, passe: 3, bloc: 7, defense: 3, service: 6 } },
  
  // Libéros
  { id: 'm13', prenom: 'Enzo', nom: 'Plongeon', posteEquipe: 'Libéro', stats: { attaque: 1, reception: 9, passe: 5, bloc: 1, defense: 9, service: 2 } },
  { id: 'm14', prenom: 'Noah', nom: 'Lecture', posteEquipe: 'Libéro', stats: { attaque: 2, reception: 8, passe: 6, bloc: 2, defense: 8, service: 3 } }
];