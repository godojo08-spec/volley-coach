import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  getAuth,
  deleteUser,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { mockPlayers } from './mockPlayers';

import Navbar from './components/Navbar';
import OnboardingModal from './components/OnboardingModal';
import CoachStatsModal from './components/CoachStatsModal';
import CreateGroupModal from './components/CreateGroupModal';
import EventModal from './components/EventModal';

import AccueilView from './views/AccueilView';
import AgendaView from './views/AgendaView';
import GenerateurView from './views/GenerateurView';
import ProfilView from './views/ProfilView';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [activeTab, setActiveTab] = useState('accueil');
  const [currentView, setCurrentView] = useState('main');

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [poste, setPoste] = useState('Réceptionneur-Attaquant (R4)');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [messageProfil, setMessageProfil] = useState('');

  const [mesStructures, setMesStructures] = useState([]);
  const [mesEquipes, setMesEquipes] = useState([]);
  const [nomStructure, setNomStructure] = useState('');
  const [messageCreation, setMessageCreation] = useState('');

  const [selectedStructure, setSelectedStructure] = useState(null);
  const [equipesStructure, setEquipesStructure] = useState([]);
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [membresEquipe, setMembresEquipe] = useState([]);
  const [bannisEquipe, setBannisEquipe] = useState([]);
  const [codeInvitation, setCodeInvitation] = useState('');
  const [messageRejoindre, setMessageRejoindre] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('structure');
  const [nomNouvelleEquipe, setNomNouvelleEquipe] = useState('');
  const [selectedStructureIdForNewTeam, setSelectedStructureIdForNewTeam] = useState('');

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStats, setOnboardingStats] = useState({
    poste1: 'Réceptionneur-Attaquant (R4)',
    poste2: 'Polyvalent',
    attaque: 5,
    reception: 5,
    passe: 5,
    bloc: 5,
    defense: 5,
    service: 5
  });
  // États pour la création de profil obligatoire à la première connexion
  const [profileLoading, setProfileLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  // États pour la gestion des invitations par lien et demandes d'adhésion
  const [pendingJoinEquipe, setPendingJoinEquipe] = useState(null);
  const [demandesEquipe, setDemandesEquipe] = useState([]);

  // États pour la validation d'e-mail et la réinitialisation de mot de passe
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [authInfoMessage, setAuthInfoMessage] = useState('');
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetOobCode, setResetOobCode] = useState(null);
  const [resetTargetEmail, setResetTargetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCoachStatsModal, setShowCoachStatsModal] = useState(false);
  const [editingMembre, setEditingMembre] = useState(null);
  const [coachStats, setCoachStats] = useState({
    posteEquipe: 'Réceptionneur-Attaquant (R4)',
    attaque: 5,
    reception: 5,
    passe: 5,
    bloc: 5,
    defense: 5,
    service: 5
  });

  const [evenements, setEvenements] = useState([]);
  const [mesPresences, setMesPresences] = useState({});
  const [presencesGlobales, setPresencesGlobales] = useState({});
  const [confirmationPresence, setConfirmationPresence] = useState(null);
  const defaultEventState = { titre: 'Entraînement', date: '', heure: '20:00', type: 'Entraînement', equipeIds: [] };
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState(defaultEventState);
  const [editingEventId, setEditingEventId] = useState(null);

  const [algoStep, setAlgoStep] = useState(1);
  const [selectedTeamsForAlgo, setSelectedTeamsForAlgo] = useState([]);
  const [algoMode, setAlgoMode] = useState(null);
  const [poolOfPlayers, setPoolOfPlayers] = useState([]);
  const [algoConfig, setAlgoConfig] = useState({ numTeams: 2, playersPerTeam: 6, lockedRoles: {} });
  const [compositionsSauvegardees, setCompositionsSauvegardees] = useState([]);
  const [loadedComposition, setLoadedComposition] = useState(null);

  const statsFields = [
    { key: 'attaque', label: 'Attaque ⚔️' },
    { key: 'bloc', label: 'Bloc 🧱' },
    { key: 'defense', label: 'Défense 🛡️' },
    { key: 'reception', label: 'Réception 👐' },
    { key: 'passe', label: 'Passe 🎯' },
    { key: 'service', label: 'Service ☄️' }
  ];

  /**
   * 1. Analyse les paramètres présents dans l'URL au chargement de la page :
   * - "?join=ID_EQUIPE" : sauvegarde l'invitation d'équipe le temps de créer/valider le compte.
   * - "?mode=verifyEmail&oobCode=..." : valide directement l'adresse e-mail via le code reçu.
   * - "?mode=resetPassword&oobCode=..." : vérifie le lien et ouvre l'écran de double saisie du nouveau mot de passe.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinEquipeId = params.get('join');
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (joinEquipeId) {
      localStorage.setItem('pendingInviteEquipeId', joinEquipeId.trim());
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (mode === 'verifyEmail' && oobCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
      applyActionCode(auth, oobCode)
        .then(async () => {
          if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
              setNeedsEmailVerification(false);
            }
          }
          setAuthInfoMessage('✅ Adresse e-mail validée avec succès !');
        })
        .catch(() => {
          setError('❌ Ce lien de validation est invalide ou a déjà été utilisé.');
        });
    }

    if (mode === 'resetPassword' && oobCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
      verifyPasswordResetCode(auth, oobCode)
        .then(targetEmail => {
          setResetTargetEmail(targetEmail);
          setResetOobCode(oobCode);
          setError('');
        })
        .catch(() => {
          setError('❌ Ce lien de réinitialisation est invalide ou a expiré. Refais une demande.');
        });
    }
  }, []);

  /**
   * 2. Surveille l'état de connexion Firebase Auth :
   * - Si nouveau compte Email/Mot de passe non vérifié : bloque sur l'écran de validation d'e-mail.
   * - Une fois l'e-mail vérifié (ou si connexion Google) : vérifie que Prénom + Nom sont renseignés.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        setProfileLoading(true);
        try {
          const docSnap = await getDoc(doc(db, 'utilisateurs', currentUser.uid));
          const data = docSnap.exists() ? docSnap.data() : {};
          const hasCompletedProfile = docSnap.exists() && Boolean(data.prenom?.trim() && data.nom?.trim());
          const isPasswordProvider = currentUser.providerData.some(p => p.providerId === 'password');

          // Exige la validation d'e-mail pour tout nouveau compte créé par e-mail/mot de passe
          if (!hasCompletedProfile && isPasswordProvider && !currentUser.emailVerified) {
            setNeedsEmailVerification(true);
          } else {
            setNeedsEmailVerification(false);
          }

          if (hasCompletedProfile) {
            setNom(data.nom);
            setPrenom(data.prenom);
            setPoste(data.poste || 'Réceptionneur-Attaquant (R4)');
            setPhotoUrl(data.photoURL || currentUser.photoURL || '');
            setNeedsProfileSetup(false);
          } else {
            // Pré-remplissage depuis Google si disponible
            const parts = (currentUser.displayName || '').trim().split(' ');
            const googlePrenom = parts[0] || '';
            const googleNom = parts.slice(1).join(' ') || '';

            setPrenom(data.prenom || googlePrenom);
            setNom(data.nom || googleNom);
            setPoste(data.poste || 'Réceptionneur-Attaquant (R4)');
            setPhotoUrl(data.photoURL || currentUser.photoURL || '');
            setNeedsProfileSetup(true);
          }

          await fetchMesDonnees(currentUser.uid);
          await fetchCompositions(currentUser.uid);
        } catch (err) {
          console.error('Erreur chargement profil :', err);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setNom('');
        setPrenom('');
        setPoste('Réceptionneur-Attaquant (R4)');
        setPhotoUrl('');
        setMesStructures([]);
        setMesEquipes([]);
        setSelectedStructure(null);
        setSelectedEquipe(null);
        setCompositionsSauvegardees([]);
        setNeedsEmailVerification(false);
        setNeedsProfileSetup(false);
        setProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  /**
   * 3. Déclenche l'inscription à l'équipe (via lien ?join=...) uniquement lorsque :
   * l'utilisateur est connecté + e-mail validé + profil (Prénom/Nom) complété.
   */
  useEffect(() => {
    if (user && !profileLoading && !needsEmailVerification && !needsProfileSetup) {
      const pendingInviteId = localStorage.getItem('pendingInviteEquipeId');
      if (pendingInviteId) {
        localStorage.removeItem('pendingInviteEquipeId');
        startJoinEquipeProcess(pendingInviteId);
      }
    }
  }, [user, profileLoading, needsEmailVerification, needsProfileSetup]);

  /**
   * Enregistre les informations obligatoires (Prénom, Nom, Poste) lors de la première connexion
   * et débloque l'accès à l'application.
   */
  const handleCompleteInitialProfile = async e => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) return;
    try {
      await setDoc(
        doc(db, 'utilisateurs', user.uid),
        {
          prenom: prenom.trim(),
          nom: nom.trim(),
          poste,
          email: user.email,
          photoURL: photoUrl || ''
        },
        { merge: true }
      );
      setNeedsProfileSetup(false);
    } catch (err) {
      console.error('Erreur création profil initial :', err);
    }
  };

  const fetchMesDonnees = async uid => {
    try {
      const qMembres = query(collection(db, 'membres'), where('utilisateurId', '==', uid));
      const querySnapshot = await getDocs(qMembres);
      const structuresTemp = [];
      const equipesTemp = [];

      for (const docMembre of querySnapshot.docs) {
        const lien = docMembre.data();
        const isCoach = lien.isCoach ?? lien.role === 'coach';
        const isJoueur = lien.isJoueur ?? lien.role === 'joueur';

        if (lien.type === 'structure') {
          const snap = await getDoc(doc(db, 'structures', lien.cibleId));
          if (snap.exists()) structuresTemp.push({ id: snap.id, isCoach, isJoueur, ...snap.data() });
        } else if (lien.type === 'equipe') {
          const snap = await getDoc(doc(db, 'equipes', lien.cibleId));
          if (snap.exists()) equipesTemp.push({ id: snap.id, isCoach, isJoueur, ...snap.data() });
        }
      }
      setMesStructures(structuresTemp);
      setMesEquipes(equipesTemp);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (mesEquipes.length > 0) fetchAgenda();
  }, [mesEquipes]);

  const fetchAgenda = async () => {
    if (mesEquipes.length === 0) return;
    try {
      const teamIds = mesEquipes.map(eq => eq.id).slice(0, 10);
      const qEvents = query(collection(db, 'evenements'), where('equipeIds', 'array-contains-any', teamIds));
      const snapEvents = await getDocs(qEvents);

      const maintenant = new Date();
      const douzeHeuresMs = 12 * 60 * 60 * 1000;
      const eventsActifs = [];

      for (const d of snapEvents.docs) {
        const evData = { id: d.id, ...d.data() };
        const dateDebut = new Date(`${evData.date}T${evData.heure || '00:00'}`);

        // Si l'événement a commencé il y a plus de 12 heures, on le nettoie
        if (!isNaN(dateDebut.getTime()) && maintenant.getTime() - dateDebut.getTime() > douzeHeuresMs) {
          try {
            const qPresEvent = query(collection(db, 'presences'), where('evenementId', '==', evData.id));
            const snapPresEvent = await getDocs(qPresEvent);
            await Promise.all(snapPresEvent.docs.map(pDoc => deleteDoc(doc(db, 'presences', pDoc.id))));
            await deleteDoc(doc(db, 'evenements', evData.id));
          } catch (delErr) {
            console.error("Erreur lors du nettoyage de l'événement expiré :", delErr);
          }
        } else {
          eventsActifs.push(evData);
        }
      }

      const eventsData = eventsActifs.sort(
        (a, b) => new Date(`${a.date}T${a.heure}`) - new Date(`${b.date}T${b.heure}`)
      );
      setEvenements(eventsData);

      const myPres = {};
      const globalPres = {};
      const usersCache = {};
      const teamMembersCache = {};

      const getUserInfo = async uid => {
        if (usersCache[uid]) return usersCache[uid];
        const uSnap = await getDoc(doc(db, 'utilisateurs', uid));
        const info = uSnap.exists()
          ? { id: uid, prenom: uSnap.data().prenom || 'Joueur', nom: uSnap.data().nom || '' }
          : { id: uid, prenom: 'Joueur', nom: '' };
        usersCache[uid] = info;
        return info;
      };

      for (const ev of eventsData) {
        // Récupérer tous les joueurs convoqués des équipes de l'événement
        const joueursConvoques = [];
        for (const tId of ev.equipeIds || []) {
          if (!teamMembersCache[tId]) {
            const qM = query(collection(db, 'membres'), where('cibleId', '==', tId), where('type', '==', 'equipe'));
            const snapM = await getDocs(qM);
            teamMembersCache[tId] = snapM.docs.map(d => d.data()).filter(m => m.isJoueur);
          }
          for (const m of teamMembersCache[tId]) {
            if (!joueursConvoques.find(j => j.id === m.utilisateurId)) {
              const info = await getUserInfo(m.utilisateurId);
              joueursConvoques.push({
                ...info,
                poste: m.coachPoste || m.poste1 || ''
              });
            }
          }
        }

        const qP = query(collection(db, 'presences'), where('evenementId', '==', ev.id));
        const snapP = await getDocs(qP);
        const reponsesMap = {};

        snapP.docs.forEach(docP => {
          const pData = docP.data();
          reponsesMap[pData.utilisateurId] = pData.statut;
          if (pData.utilisateurId === user.uid) myPres[ev.id] = pData.statut;
        });

        const listePresents = [];
        const listeAbsents = [];
        const listeEnAttente = [];
        const joueursPresents = [];

        for (const joueur of joueursConvoques) {
          const statut = reponsesMap[joueur.id];
          if (statut === 'present') {
            listePresents.push(joueur);
            joueursPresents.push(joueur.id);
          } else if (statut === 'absent') {
            listeAbsents.push(joueur);
          } else {
            listeEnAttente.push(joueur);
          }
        }

        // Inclure d'éventuels répondants hors liste joueurs (ex: coach)
        for (const [uid, statut] of Object.entries(reponsesMap)) {
          if (!joueursConvoques.find(j => j.id === uid)) {
            const info = await getUserInfo(uid);
            if (statut === 'present') {
              listePresents.push(info);
              joueursPresents.push(uid);
            } else if (statut === 'absent') {
              listeAbsents.push(info);
            }
          }
        }

        globalPres[ev.id] = {
          present: listePresents.length,
          absent: listeAbsents.length,
          enAttente: listeEnAttente.length,
          joueursPresents,
          listePresents,
          listeAbsents,
          listeEnAttente
        };
      }
      setMesPresences(myPres);
      setPresencesGlobales(globalPres);
    } catch (e) {
      console.error('Erreur Agenda:', e);
    }
  };

  const openCreateEventModal = () => {
    setEventFormData(defaultEventState);
    setEditingEventId(null);
    setShowEventModal(true);
  };
  const openEditEventModal = ev => {
    setEventFormData({ titre: ev.titre, date: ev.date, heure: ev.heure, type: ev.type, equipeIds: ev.equipeIds || [] });
    setEditingEventId(ev.id);
    setShowEventModal(true);
  };

  const handleSaveEvent = async e => {
    e.preventDefault();
    if (!eventFormData.equipeIds || eventFormData.equipeIds.length === 0) return alert('Veuillez sélectionner au moins une équipe.');
    try {
      if (editingEventId) await updateDoc(doc(db, 'evenements', editingEventId), { ...eventFormData });
      else await addDoc(collection(db, 'evenements'), { ...eventFormData, createurId: user.uid, dateCreation: new Date().toISOString() });
      setShowEventModal(false);
      setEventFormData(defaultEventState);
      setEditingEventId(null);
      fetchAgenda();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async eventId => {
    if (window.confirm('Es-tu sûr de vouloir annuler et supprimer cet événement ?')) {
      try {
        await deleteDoc(doc(db, 'evenements', eventId));
        fetchAgenda();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePresence = async (eventId, statut) => {
    try {
      const docId = `${eventId}_${user.uid}`;
      await setDoc(
        doc(db, 'presences', docId),
        { evenementId: eventId, utilisateurId: user.uid, statut, dateReponse: new Date().toISOString() },
        { merge: true }
      );
      setMesPresences(prev => ({ ...prev, [eventId]: statut }));
      setConfirmationPresence({ eventId, statut });
      setTimeout(() => {
        setConfirmationPresence(prev => (prev?.eventId === eventId ? null : prev));
      }, 3000);
      fetchAgenda();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStructure = async e => {
    e.preventDefault();
    try {
      const structRef = await addDoc(collection(db, 'structures'), {
        nom: nomStructure,
        createurId: user.uid,
        dateCreation: new Date()
      });
      await addDoc(collection(db, 'membres'), {
        utilisateurId: user.uid,
        cibleId: structRef.id,
        type: 'structure',
        isCoach: true,
        isJoueur: false
      });
      setMessageCreation('✅ Structure créée !');
      setTimeout(() => {
        setMessageCreation('');
        setNomStructure('');
        setShowCreateModal(false);
        setCurrentView('main');
        fetchMesDonnees(user.uid);
      }, 1500);
    } catch (err) {
      setMessageCreation('❌ Erreur lors de la création.');
    }
  };

  const handleCreateEquipe = async e => {
    e.preventDefault();
    if (!selectedStructureIdForNewTeam) return alert('Veuillez sélectionner une structure parente.');
    try {
      const struct = mesStructures.find(s => s.id === selectedStructureIdForNewTeam);
      const eqRef = await addDoc(collection(db, 'equipes'), {
        nom: nomNouvelleEquipe,
        structureId: struct.id,
        nomStructure: struct.nom,
        createurId: user.uid,
        dateCreation: new Date()
      });
      await addDoc(collection(db, 'membres'), {
        utilisateurId: user.uid,
        cibleId: eqRef.id,
        type: 'equipe',
        isCoach: true,
        isJoueur: false
      });
      setMessageCreation('✅ Équipe créée !');
      setTimeout(() => {
        setMessageCreation('');
        setNomNouvelleEquipe('');
        setShowCreateModal(false);
        fetchMesDonnees(user.uid);
        if (currentView === 'detail_structure' && selectedStructure?.id === struct.id) handleOpenStructure(struct);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenStructure = async struct => {
    setOpenMenuId(null);
    setSelectedStructure(struct);
    setCurrentView('detail_structure');
    try {
      const qEquipes = query(collection(db, 'equipes'), where('structureId', '==', struct.id));
      const snap = await getDocs(qEquipes);
      setEquipesStructure(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEquipe = async equipe => {
    setSelectedEquipe(equipe);
    setCurrentView('detail_equipe');
    setOpenMenuId(null);
    try {
      const qMembres = query(collection(db, 'membres'), where('cibleId', '==', equipe.id), where('type', '==', 'equipe'));
      const snap = await getDocs(qMembres);
      const membresTemp = [];
      for (const d of snap.docs) {
        const lien = d.data();
        const userSnap = await getDoc(doc(db, 'utilisateurs', lien.utilisateurId));
        const isCoach = lien.isCoach ?? lien.role === 'coach';
        const isJoueur = lien.isJoueur ?? lien.role === 'joueur';
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const posteOriginal = lien.poste1 || userData.poste || 'Polyvalent';
          membresTemp.push({
            ...userData,
            id: userSnap.id,
            membreDocId: d.id,
            isCoach,
            isJoueur,
            email: userData.email,
            posteOriginal,
            coachPoste: lien.coachPoste || null,
            posteEquipe: lien.coachPoste || posteOriginal,
            stats: lien.stats || null,
            coachStats: lien.coachStats || null,
            coachUpdatedBy: lien.coachUpdatedBy || null
          });
        } else {
          membresTemp.push({
            id: lien.utilisateurId,
            membreDocId: d.id,
            isCoach,
            isJoueur,
            prenom: 'Nouveau',
            nom: 'Joueur',
            posteEquipe: 'Inconnu'
          });
        }
      }
      setMembresEquipe(membresTemp);

      // Chargement des bannissements actifs de l'équipe
      const qBans = query(collection(db, 'bannissements'), where('equipeId', '==', equipe.id));
      const snapBans = await getDocs(qBans);
      const maintenant = new Date();
      const bannisActifs = [];
      for (const bDoc of snapBans.docs) {
        const bData = bDoc.data();
        if (new Date(bData.dateFin) > maintenant) {
          bannisActifs.push({ id: bDoc.id, ...bData });
        } else {
          await deleteDoc(doc(db, 'bannissements', bDoc.id));
        }
      }
      setBannisEquipe(bannisActifs);
      // Chargement des demandes d'adhésion en attente pour cette équipe (visible par le coach)
      const qDemandes = query(collection(db, 'demandes_adhesion'), where('equipeId', '==', equipe.id));
      const snapDemandes = await getDocs(qDemandes);
      const demandesList = snapDemandes.docs
        .map(docD => ({ id: docD.id, ...docD.data() }))
        .sort((a, b) => new Date(a.dateDemande) - new Date(b.dateDemande));
      setDemandesEquipe(demandesList);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Lance le processus pour rejoindre une équipe (appelé soit via le formulaire de code,
   * soit automatiquement via un lien d'invitation "?join=ID_EQUIPE").
   * Vérifie l'existence de l'équipe, les bannissements, et les doublons avant d'ouvrir la modale sportive.
   */
  const startJoinEquipeProcess = async rawEquipeId => {
    setMessageRejoindre('');
    try {
      const codeNettoye = rawEquipeId.trim();
      if (!codeNettoye) return;

      const eqSnap = await getDoc(doc(db, 'equipes', codeNettoye));
      if (!eqSnap.exists()) {
        setMessageRejoindre('❌ Code ou lien d\'invitation invalide.');
        return;
      }

      // 1. Vérification si l'utilisateur est suspendu de cette équipe
      const qBans = query(collection(db, 'bannissements'), where('equipeId', '==', codeNettoye));
      const snapBans = await getDocs(qBans);
      const maintenant = new Date();
      const banActif = snapBans.docs
        .map(d => d.data())
        .find(
          b =>
            new Date(b.dateFin) > maintenant &&
            ((b.email && b.email.toLowerCase() === (user.email || '').toLowerCase()) || b.utilisateurId === user.uid)
        );

      if (banActif) {
        const dateFinFr = new Date(banActif.dateFin).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        setMessageRejoindre(`⛔ Accès refusé : tu es suspendu de cette équipe jusqu'au ${dateFinFr}.`);
        return;
      }

      // 2. Vérification si déjà membre de l'équipe
      const qExist = query(
        collection(db, 'membres'),
        where('cibleId', '==', codeNettoye),
        where('utilisateurId', '==', user.uid)
      );
      const existSnap = await getDocs(qExist);
      if (!existSnap.empty) {
        setMessageRejoindre('ℹ️ Tu fais déjà partie de cette équipe.');
        return;
      }

      // 3. Vérification si une demande d'adhésion est déjà en attente de validation
      const qDemandeExist = query(
        collection(db, 'demandes_adhesion'),
        where('equipeId', '==', codeNettoye),
        where('utilisateurId', '==', user.uid)
      );
      const demandeExistSnap = await getDocs(qDemandeExist);
      if (!demandeExistSnap.empty) {
        setMessageRejoindre('⏳ Ta demande pour rejoindre cette équipe est déjà en attente de validation par le coach.');
        return;
      }

      // 4. Prépare la modale de profil sportif (2 postes + stats) pour cette équipe
      const eqData = eqSnap.data();
      setPendingJoinEquipe({
        id: eqSnap.id,
        nom: eqData.nom,
        accesControle: Boolean(eqData.accesControle),
        isSelfCoachJoin: false
      });
      setOnboardingStats({
        poste1: poste || 'Polyvalent',
        poste2: 'Polyvalent',
        attaque: 5,
        reception: 5,
        passe: 5,
        bloc: 5,
        defense: 5,
        service: 5
      });
      setShowOnboardingModal(true);
      setCodeInvitation('');
    } catch (err) {
      console.error(err);
      setMessageRejoindre('❌ Erreur lors de la tentative de connexion à l\'équipe.');
    }
  };

  /**
   * Soumission du formulaire "Rejoindre une équipe" depuis l'accueil.
   */
  const handleJoinEquipe = async e => {
    e.preventDefault();
    await startJoinEquipeProcess(codeInvitation);
  };

  /**
   * Enregistre les 2 postes et les stats du joueur après validation de la modale :
   * - Si c'est un coach qui s'ajoute comme joueur : met à jour sa fiche membre.
   * - Si l'équipe est sur validation (accesControle) : crée une demande dans "demandes_adhesion".
   * - Si l'équipe est en entrée libre : ajoute directement le joueur dans "membres".
   */
  const handleSaveOnboarding = async e => {
    e.preventDefault();
    try {
      const statsObjet = {
        attaque: onboardingStats.attaque,
        reception: onboardingStats.reception,
        passe: onboardingStats.passe,
        bloc: onboardingStats.bloc,
        defense: onboardingStats.defense,
        service: onboardingStats.service
      };

      if (pendingJoinEquipe?.isSelfCoachJoin) {
        // Cas 1 : Le coach s'ajoute lui-même comme joueur dans son équipe
        await setDoc(
          doc(db, 'membres', pendingJoinEquipe.membreDocId),
          {
            isJoueur: true,
            poste1: onboardingStats.poste1,
            poste2: onboardingStats.poste2,
            stats: statsObjet
          },
          { merge: true }
        );
      } else if (pendingJoinEquipe?.accesControle) {
        // Cas 2 : L'équipe demande une validation du coach -> enregistrement dans "demandes_adhesion"
        await addDoc(collection(db, 'demandes_adhesion'), {
          equipeId: pendingJoinEquipe.id,
          equipeNom: pendingJoinEquipe.nom,
          utilisateurId: user.uid,
          prenom: prenom || 'Joueur',
          nom: nom || '',
          email: user.email || '',
          photoURL: photoUrl || '',
          poste1: onboardingStats.poste1,
          poste2: onboardingStats.poste2,
          stats: statsObjet,
          dateDemande: new Date().toISOString()
        });
        setMessageRejoindre(`⏳ Demande envoyée ! Le coach de "${pendingJoinEquipe.nom}" doit valider ton entrée.`);
      } else if (pendingJoinEquipe?.id) {
        // Cas 3 : Entrée libre -> ajout immédiat dans l'effectif ("membres")
        await addDoc(collection(db, 'membres'), {
          utilisateurId: user.uid,
          cibleId: pendingJoinEquipe.id,
          type: 'equipe',
          isCoach: false,
          isJoueur: true,
          poste1: onboardingStats.poste1,
          poste2: onboardingStats.poste2,
          stats: statsObjet
        });
        setMessageRejoindre(`✅ Tu as rejoint l'équipe "${pendingJoinEquipe.nom}" !`);
      }

      // Met à jour le poste principal par défaut sur le profil utilisateur
      await setDoc(
        doc(db, 'utilisateurs', user.uid),
        { email: user.email, nom: nom || '', prenom: prenom || '', poste: onboardingStats.poste1 },
        { merge: true }
      );

      setPoste(onboardingStats.poste1);
      setShowOnboardingModal(false);
      setPendingJoinEquipe(null);
      await fetchMesDonnees(user.uid);
      if (selectedEquipe) await handleOpenEquipe(selectedEquipe);
    } catch (err) {
      console.error('Erreur enregistrement profil sportif :', err);
    }
  };

  /**
   * Permet au coach de basculer le mode d'entrée de son équipe
   * entre "Entrée libre" (accesControle: false) et "Sur validation" (accesControle: true).
   */
  const handleToggleEquipeAccess = async () => {
    if (!selectedEquipe) return;
    const nouveauMode = !selectedEquipe.accesControle;
    try {
      await updateDoc(doc(db, 'equipes', selectedEquipe.id), {
        accesControle: nouveauMode
      });
      setSelectedEquipe(prev => ({ ...prev, accesControle: nouveauMode }));
      await fetchMesDonnees(user.uid);
    } catch (err) {
      console.error("Erreur changement mode d'accès :", err);
    }
  };

  /**
   * Accepte la demande d'adhésion d'un joueur : l'ajoute à l'effectif ("membres")
   * avec ses 2 postes et ses stats, puis supprime la demande en attente.
   */
  const handleAcceptDemande = async demande => {
    try {
      // Vérifie que le joueur n'a pas déjà été ajouté entre-temps
      const qExist = query(
        collection(db, 'membres'),
        where('cibleId', '==', demande.equipeId),
        where('utilisateurId', '==', demande.utilisateurId)
      );
      const existSnap = await getDocs(qExist);

      if (existSnap.empty) {
        await addDoc(collection(db, 'membres'), {
          utilisateurId: demande.utilisateurId,
          cibleId: demande.equipeId,
          type: 'equipe',
          isCoach: false,
          isJoueur: true,
          poste1: demande.poste1 || 'Polyvalent',
          poste2: demande.poste2 || 'Polyvalent',
          stats: demande.stats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 }
        });
      }

      await deleteDoc(doc(db, 'demandes_adhesion', demande.id));
      await handleOpenEquipe(selectedEquipe);
    } catch (err) {
      console.error('Erreur acceptation demande :', err);
    }
  };

  /**
   * Refuse et supprime la demande d'adhésion d'un joueur.
   */
  const handleRejectDemande = async demandeId => {
    if (window.confirm("Refuser cette demande d'adhésion ?")) {
      try {
        await deleteDoc(doc(db, 'demandes_adhesion', demandeId));
        await handleOpenEquipe(selectedEquipe);
      } catch (err) {
        console.error('Erreur refus demande :', err);
      }
    }
  };

  const handlePromote = async (membre, mode) => {
    if (window.confirm(`Sûr de vouloir passer ${membre.prenom} en rôle "${mode}" ?`)) {
      try {
        await updateDoc(doc(db, 'membres', membre.membreDocId), {
          isCoach: true,
          isJoueur: mode === 'Coach + Joueur'
        });
        setOpenMenuId(null);
        handleOpenEquipe(selectedEquipe);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRemove = async membre => {
    if (window.confirm(`Sûr de vouloir retirer ${membre.prenom} de l'équipe ?`)) {
      try {
        await deleteDoc(doc(db, 'membres', membre.membreDocId));
        setOpenMenuId(null);
        handleOpenEquipe(selectedEquipe);
      } catch (err) {}
    }
  };

  const handleBan = async (membre, jours = 7) => {
    if (
      window.confirm(
        `Bannir ${membre.prenom} ${membre.nom} (${membre.email || 'sans e-mail'}) pendant ${jours} jours ? Il sera retiré et ne pourra pas revenir avant la fin du délai.`
      )
    ) {
      try {
        const dateFin = new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString();
        await addDoc(collection(db, 'bannissements'), {
          equipeId: selectedEquipe.id,
          email: (membre.email || '').toLowerCase(),
          utilisateurId: membre.id,
          prenom: membre.prenom || '',
          nom: membre.nom || '',
          dateFin,
          banniPar: prenom ? `${prenom} ${nom}`.trim() : user.email,
          dateBannissement: new Date().toISOString()
        });
        await deleteDoc(doc(db, 'membres', membre.membreDocId));
        setOpenMenuId(null);
        handleOpenEquipe(selectedEquipe);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUnban = async banId => {
    if (window.confirm('Lever la suspension de ce joueur ?')) {
      try {
        await deleteDoc(doc(db, 'bannissements', banId));
        handleOpenEquipe(selectedEquipe);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLeaveEquipe = async () => {
    const monLien = membresEquipe.find(m => m.id === user.uid);
    if (!monLien || !monLien.isJoueur) return;

    if (monLien.isCoach) {
      if (
        window.confirm(
          `Tu es également coach de "${selectedEquipe.nom}". Veux-tu te retirer uniquement de l'effectif joueur (tu conserveras ton accès coach) ?`
        )
      ) {
        try {
          await updateDoc(doc(db, 'membres', monLien.membreDocId), { isJoueur: false });
          await fetchMesDonnees(user.uid);
          await handleOpenEquipe(selectedEquipe);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      if (window.confirm(`Es-tu sûr de vouloir quitter l'équipe "${selectedEquipe.nom}" ?`)) {
        try {
          await deleteDoc(doc(db, 'membres', monLien.membreDocId));
          await fetchMesDonnees(user.uid);
          setSelectedEquipe(null);
          setCurrentView('main');
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handleRenameEquipe = async (equipeId, nouveauNom) => {
    const nomPropre = nouveauNom.trim();
    if (!nomPropre) return;
    try {
      await updateDoc(doc(db, 'equipes', equipeId), { nom: nomPropre });
      await fetchMesDonnees(user.uid);
      if (selectedStructure) {
        await handleOpenStructure(selectedStructure);
      }
    } catch (err) {
      console.error('Erreur renommage équipe :', err);
    }
  };

  const handleClearEquipePlayers = async equipe => {
    if (
      window.confirm(
        `Sûr de vouloir supprimer TOUS les joueurs de l'équipe "${equipe.nom}" ?\n(Les coachs conserveront leur accès à l'équipe.)`
      )
    ) {
      try {
        const qMembres = query(collection(db, 'membres'), where('cibleId', '==', equipe.id), where('type', '==', 'equipe'));
        const snap = await getDocs(qMembres);

        for (const d of snap.docs) {
          const lien = d.data();
          const isCoach = lien.isCoach ?? lien.role === 'coach';
          const isJoueur = lien.isJoueur ?? lien.role === 'joueur';

          if (isJoueur) {
            if (isCoach) {
              await updateDoc(doc(db, 'membres', d.id), { isJoueur: false });
            } else {
              await deleteDoc(doc(db, 'membres', d.id));
            }
          }
        }

        setOpenMenuId(null);
        await fetchMesDonnees(user.uid);
        if (selectedStructure) {
          await handleOpenStructure(selectedStructure);
        }
        alert(`✅ Tous les joueurs ont été retirés de "${equipe.nom}".`);
      } catch (err) {
        console.error('Erreur suppression des joueurs :', err);
      }
    }
  };

  const handleDeleteEquipe = async equipe => {
    if (
      window.confirm(
        `⚠️ Supprimer définitivement l'équipe "${equipe.nom}" ?\nTous les membres et suspensions liés à cette équipe seront supprimés. Cette action est irréversible.`
      )
    ) {
      try {
        // 1. Supprimer tous les liens membres de l'équipe
        const qMembres = query(collection(db, 'membres'), where('cibleId', '==', equipe.id), where('type', '==', 'equipe'));
        const snapMembres = await getDocs(qMembres);
        await Promise.all(snapMembres.docs.map(d => deleteDoc(doc(db, 'membres', d.id))));

        // 2. Supprimer les éventuels bannissements de l'équipe
        const qBans = query(collection(db, 'bannissements'), where('equipeId', '==', equipe.id));
        const snapBans = await getDocs(qBans);
        await Promise.all(snapBans.docs.map(d => deleteDoc(doc(db, 'bannissements', d.id))));

        // 3. Supprimer le document de l'équipe
        await deleteDoc(doc(db, 'equipes', equipe.id));

        setOpenMenuId(null);
        await fetchMesDonnees(user.uid);
        if (selectedStructure) {
          await handleOpenStructure(selectedStructure);
        }
      } catch (err) {
        console.error('Erreur suppression équipe :', err);
      }
    }
  };

  const handleOpenCoachStats = async membre => {
    setOpenMenuId(null);
    try {
      const membreSnap = await getDoc(doc(db, 'membres', membre.membreDocId));
      const lien = membreSnap.exists() ? membreSnap.data() : {};
      const originalStats = lien.stats || membre.stats || null;
      const currentCoachStats = lien.coachStats || membre.coachStats || null;
      const posteOriginal = lien.poste1 || membre.posteOriginal || membre.poste || 'Polyvalent';
      const currentCoachPoste = lien.coachPoste || membre.coachPoste || null;

      setEditingMembre({
        ...membre,
        stats: originalStats,
        coachStats: currentCoachStats,
        posteOriginal,
        coachPoste: currentCoachPoste,
        coachUpdatedBy: lien.coachUpdatedBy || membre.coachUpdatedBy || null
      });

      const baseStats = currentCoachStats || originalStats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 };
      setCoachStats({
        posteEquipe: currentCoachPoste || posteOriginal,
        ...baseStats
      });
      setShowCoachStatsModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCoachStats = async e => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'membres', editingMembre.membreDocId), {
        coachPoste: coachStats.posteEquipe,
        coachStats: {
          attaque: coachStats.attaque,
          reception: coachStats.reception,
          passe: coachStats.passe,
          bloc: coachStats.bloc,
          defense: coachStats.defense,
          service: coachStats.service
        },
        coachUpdatedBy: prenom ? `${prenom} ${nom}`.trim() : user.email,
        coachUpdatedAt: new Date().toISOString()
      });
      setShowCoachStatsModal(false);
      handleOpenEquipe(selectedEquipe);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTeamSelection = equipeId => {
    setSelectedTeamsForAlgo(prev => (prev.includes(equipeId) ? prev.filter(id => id !== equipeId) : [...prev, equipeId]));
  };

  const handleGoToStep2 = async () => {
    setLoadedComposition(null);
    try {
      let allPlayers = [];
      for (const teamId of selectedTeamsForAlgo) {
        const qMembres = query(collection(db, 'membres'), where('cibleId', '==', teamId), where('type', '==', 'equipe'));
        const snap = await getDocs(qMembres);
        for (const d of snap.docs) {
          const lien = d.data();
          if (lien.isJoueur) {
            const userSnap = await getDoc(doc(db, 'utilisateurs', lien.utilisateurId));
            if (userSnap.exists() && !allPlayers.find(p => p.id === userSnap.id)) {
              allPlayers.push({
                id: userSnap.id,
                prenom: userSnap.data().prenom || 'Joueur',
                nom: userSnap.data().nom || '',
                photoURL: userSnap.data().photoURL || '',
                posteEquipe: lien.coachPoste || lien.poste1 || userSnap.data().poste || 'Polyvalent',
                stats: lien.coachStats || lien.stats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 }
              });
            }
          }
        }
      }
      if (allPlayers.length === 0) allPlayers = [...mockPlayers];
      setPoolOfPlayers(allPlayers);
      setAlgoStep(2);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateFromEvent = async event => {
    setLoadedComposition(null);
    const presentIds = presencesGlobales[event.id]?.joueursPresents || [];
    if (presentIds.length === 0) return alert('Aucun joueur présent pour générer une équipe.');
    try {
      let allPlayers = [];
      for (const tId of event.equipeIds || []) {
        const qMembres = query(collection(db, 'membres'), where('cibleId', '==', tId), where('type', '==', 'equipe'));
        const snap = await getDocs(qMembres);
        for (const d of snap.docs) {
          const lien = d.data();
          if (lien.isJoueur && presentIds.includes(lien.utilisateurId)) {
            if (!allPlayers.find(p => p.id === lien.utilisateurId)) {
              const userSnap = await getDoc(doc(db, 'utilisateurs', lien.utilisateurId));
              if (userSnap.exists()) {
                allPlayers.push({
                  id: userSnap.id,
                  prenom: userSnap.data().prenom || 'Joueur',
                  nom: userSnap.data().nom || '',
                  photoURL: userSnap.data().photoURL || '',
                  posteEquipe: lien.coachPoste || lien.poste1 || userSnap.data().poste || 'Polyvalent',
                  stats: lien.coachStats || lien.stats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 }
                });
              }
            }
          }
        }
      }
      setPoolOfPlayers(allPlayers);
      setSelectedTeamsForAlgo(event.equipeIds || []);
      setAlgoStep(2);
      setActiveTab('generateur');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectModeAndConfigure = mode => {
    setLoadedComposition(null);
    setAlgoMode(mode);
    setAlgoStep(3);
  };

  const fetchCompositions = async uid => {
    try {
      const qComp = query(collection(db, 'compositions'), where('createurId', '==', uid));
      const snap = await getDocs(qComp);
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
      setCompositionsSauvegardees(list);
    } catch (err) {
      console.error('Erreur chargement compositions:', err);
    }
  };

  const handleSaveComposition = async ({ titre, mode, config, teams, bench }) => {
    try {
      const serializedTeams = teams.map((teamArr, idx) => ({
        nom: `Équipe ${idx + 1}`,
        joueurs: teamArr.map(p => p || null)
      }));
      const nomsEquipes = mesEquipes
        .filter(eq => selectedTeamsForAlgo.includes(eq.id))
        .map(eq => eq.nom);

      await addDoc(collection(db, 'compositions'), {
        titre: titre.trim() || `Compo ${mode} - ${new Date().toLocaleDateString('fr-FR')}`,
        mode,
        config,
        teamsData: serializedTeams,
        bench: bench || [],
        equipeIds: selectedTeamsForAlgo,
        nomsEquipes,
        createurId: user.uid,
        dateCreation: new Date().toISOString()
      });
      await fetchCompositions(user.uid);
      return true;
    } catch (err) {
      console.error('Erreur sauvegarde composition:', err);
      return false;
    }
  };

  const handleOpenSavedComposition = compo => {
    const restoredTeams = (compo.teamsData || []).map(t => t.joueurs || []);
    const restoredBench = compo.bench || [];
    const allSavedPlayers = [...restoredTeams.flat(), ...restoredBench].filter(Boolean);

    setPoolOfPlayers(allSavedPlayers);
    setSelectedTeamsForAlgo(compo.equipeIds || []);
    setAlgoMode(compo.mode);
    setAlgoConfig(compo.config || { numTeams: restoredTeams.length || 2, playersPerTeam: 6, lockedRoles: {} });
    setLoadedComposition({
      id: compo.id,
      titre: compo.titre,
      teams: restoredTeams,
      bench: restoredBench
    });
    setAlgoStep(4);
  };

  const handleDeleteComposition = async compoId => {
    if (window.confirm('Supprimer cette composition sauvegardée ?')) {
      try {
        await deleteDoc(doc(db, 'compositions', compoId));
        fetchCompositions(user.uid);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: 'Utilisateur non connecté.' };

    const uid = currentUser.uid;

    try {
      // 1. Supprimer toutes ses adhésions aux équipes et structures (collection "membres")
      const qMembres = query(collection(db, 'membres'), where('utilisateurId', '==', uid));
      const snapMembres = await getDocs(qMembres);
      await Promise.all(snapMembres.docs.map(d => deleteDoc(doc(db, 'membres', d.id))));

      // 2. Supprimer toutes ses réponses de présence (collection "presences")
      const qPresences = query(collection(db, 'presences'), where('utilisateurId', '==', uid));
      const snapPresences = await getDocs(qPresences);
      await Promise.all(snapPresences.docs.map(d => deleteDoc(doc(db, 'presences', d.id))));

      // 3. Supprimer ses compositions sauvegardées (collection "compositions")
      const qCompos = query(collection(db, 'compositions'), where('createurId', '==', uid));
      const snapCompos = await getDocs(qCompos);
      await Promise.all(snapCompos.docs.map(d => deleteDoc(doc(db, 'compositions', d.id))));

      // 4. Supprimer d'éventuels bannissements associés (collection "bannissements")
      const qBannis = query(collection(db, 'bannissements'), where('utilisateurId', '==', uid));
      const snapBannis = await getDocs(qBannis);
      await Promise.all(snapBannis.docs.map(d => deleteDoc(doc(db, 'bannissements', d.id))));

      // 5. Supprimer sa fiche profil principale (collection "utilisateurs")
      await deleteDoc(doc(db, 'utilisateurs', uid));

      // 6. Supprimer définitivement le compte d'authentification Firebase Auth
      await deleteUser(currentUser);

      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression du compte :', err);
      if (err.code === 'auth/requires-recent-login') {
        return {
          success: false,
          error:
            'Par mesure de sécurité, déconnecte-toi puis reconnecte-toi avant de relancer la suppression définitive.'
        };
      }
      return {
        success: false,
        error: 'Une erreur est survenue lors de la suppression du compte.'
      };
    }
  };

  const handleSaveProfile = async e => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'utilisateurs', user.uid), { nom, prenom, poste, email: user.email, photoURL: photoUrl }, { merge: true });
      setMessageProfil('✅ Profil mis à jour !');
      setIsEditingProfile(false);
      setTimeout(() => setMessageProfil(''), 3000);
    } catch (err) {}
  };

  const handlePhotoUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /**
   * Connexion ou création de compte par Email / Mot de passe.
   * En cas de création de compte, envoie immédiatement l'e-mail de validation.
   */
  const handleAuth = async e => {
    e.preventDefault();
    setError('');
    setAuthInfoMessage('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user, {
          url: window.location.origin
        });
        setNeedsEmailVerification(true);
        setAuthInfoMessage(`📩 Un e-mail de confirmation a été envoyé à ${email}.`);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse e-mail est déjà utilisée. Essaie de te connecter.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou mot de passe incorrect.');
      } else {
        setError(err.message || "Erreur d'authentification.");
      }
    }
  };

  /**
   * Vérifie auprès de Firebase si l'utilisateur a bien cliqué sur le lien reçu par mail.
   * Si oui, débloque l'étape suivante (création du profil Prénom / Nom / Poste).
   */
  const handleCheckEmailVerified = async () => {
    setError('');
    setAuthInfoMessage('');
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setNeedsEmailVerification(false);
      } else {
        setError("⏳ Ton adresse n'est pas encore validée. Clique sur le lien dans ton e-mail (pense aux spams) puis réessaie.");
      }
    } catch (err) {
      setError('Erreur lors de la vérification. Réessaie dans un instant.');
    }
  };

  /**
   * Renvoie un nouvel e-mail de confirmation si l'utilisateur ne l'a pas reçu.
   */
  const handleResendVerificationEmail = async () => {
    setError('');
    setAuthInfoMessage('');
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin
      });
      setAuthInfoMessage('✅ Nouvel e-mail de confirmation envoyé ! Vérifie ta boîte de réception et tes spams.');
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Attends une minute avant de renvoyer un e-mail.');
      } else {
        setError("Impossible de renvoyer l'e-mail pour le moment.");
      }
    }
  };

  /**
   * Envoie l'e-mail de réinitialisation de mot de passe depuis la page de connexion.
   */
  const handleForgotPasswordSubmit = async e => {
    e.preventDefault();
    setError('');
    setAuthInfoMessage('');
    if (!email.trim()) {
      setError('Renseigne ton adresse e-mail.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: window.location.origin
      });
      setAuthInfoMessage(`✅ Lien de réinitialisation envoyé à ${email.trim()} ! Vérifie ta boîte mail (et tes spams).`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Aucun compte ne correspond à cette adresse e-mail.');
      } else {
        setError("Erreur lors de l'envoi de l'e-mail de réinitialisation.");
      }
    }
  };

  /**
   * Valide le nouveau mot de passe saisi 2 fois après ouverture du lien reçu par e-mail.
   */
  const handleConfirmNewPassword = async e => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('❌ Les deux mots de passe ne sont pas identiques.');
      return;
    }
    try {
      await confirmPasswordReset(auth, resetOobCode, newPassword);
      setResetOobCode(null);
      setNewPassword('');
      setConfirmNewPassword('');
      if (resetTargetEmail) setEmail(resetTargetEmail);
      setIsLoginMode(true);
      setIsForgotPasswordMode(false);
      setAuthInfoMessage('✅ Mot de passe modifié avec succès ! Tu peux maintenant te connecter.');
    } catch (err) {
      setError('❌ Le lien a expiré ou est invalide. Refais une demande de réinitialisation.');
    }
  };

  const handleGoogle = async () => {
    setError('');
    setAuthInfoMessage('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err.message || 'Erreur avec Google.');
    }
  };

  const handleLogout = () => signOut(auth);

  // Écran affiché quand l'utilisateur clique sur le lien de réinitialisation reçu par mail
  if (resetOobCode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md animate-fade-in">
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau mot de passe</h1>
            {resetTargetEmail && (
              <p className="text-xs text-gray-500 mt-1">
                Compte : <span className="font-bold text-gray-700">{resetTargetEmail}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleConfirmNewPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Répète le mot de passe"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all"
            >
              Enregistrer le nouveau mot de passe
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setResetOobCode(null);
              setError('');
            }}
            className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 font-medium underline"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Écran de chargement pendant la vérification de la fiche profil
  if (user && profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm font-bold text-gray-500 animate-pulse">Chargement de ton profil...</p>
      </div>
    );
  }

  // Écran bloquant tant que l'adresse e-mail du nouveau compte n'est pas validée
  if (user && needsEmailVerification) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center animate-fade-in">
          <span className="text-4xl">📧</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-3">Valide ton adresse e-mail</h1>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Un lien de confirmation a été envoyé à <span className="font-bold text-gray-800">{user.email}</span>.
            <br />
            Clique sur le lien dans ton e-mail puis appuie sur le bouton ci-dessous pour continuer.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 text-left">
              {error}
            </div>
          )}

          {authInfoMessage && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 text-left">
              {authInfoMessage}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleCheckEmailVerified}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all"
            >
              ✅ J'ai validé mon e-mail
            </button>

            <button
              type="button"
              onClick={handleResendVerificationEmail}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-all"
            >
              📩 Renvoyer l'e-mail de confirmation
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-5 text-xs text-gray-400 hover:text-gray-600 font-medium underline"
          >
            Se déconnecter / Utiliser une autre adresse
          </button>
        </div>
      </div>
    );
  }

  // Écran obligatoire à la première inscription (Email ou Google) tant que Nom et Prénom ne sont pas saisis
  if (user && needsProfileSetup) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md animate-fade-in">
          <div className="text-center mb-6">
            <span className="text-4xl">🏐</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Bienvenue sur Volley Coach !</h1>
            <p className="text-xs text-gray-500 mt-1">
              Renseigne ton prénom et ton nom pour que tes coachs et coéquipiers puissent t'identifier.
            </p>
          </div>

          <form onSubmit={handleCompleteInitialProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder="Ex : Lucas"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex : Martin"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Poste principal
              </label>
              <select
                value={poste}
                onChange={e => setPoste(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium bg-white"
              >
                <option value="Passeur (P)">Passeur (P)</option>
                <option value="Pointu (Pt)">Pointu (Pt)</option>
                <option value="Réceptionneur-Attaquant (R4)">Réceptionneur-Attaquant (R4)</option>
                <option value="Central (C)">Central (C)</option>
                <option value="Libéro (L)">Libéro (L)</option>
                <option value="Polyvalent">Polyvalent</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all mt-2"
            >
              Continuer vers l'application
            </button>
          </form>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 font-medium underline"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (user) {
    const isCoachOfAnyTeam = mesEquipes.some(eq => eq.isCoach);

    const maintenant = new Date();
    const debutAujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    const dans7Jours = new Date(debutAujourdhui.getTime() + 7 * 24 * 60 * 60 * 1000);

    const evenements7Jours = evenements.filter(ev => {
      const dateEv = new Date(`${ev.date}T${ev.heure || '00:00'}`);
      const concerne = mesEquipes.some(e => (ev.equipeIds || []).includes(e.id));
      return concerne && dateEv >= debutAujourdhui && dateEv <= dans7Jours;
    });

    const notifAgendaCount = evenements7Jours.filter(ev => {
      const estJoueur = mesEquipes.some(e => (ev.equipeIds || []).includes(e.id) && e.isJoueur);
      return estJoueur && !mesPresences[ev.id];
    }).length;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <div className="flex-grow pb-24">
          {activeTab === 'accueil' && (
            <AccueilView
              currentView={currentView}
              setCurrentView={setCurrentView}
              prenom={prenom}
              codeInvitation={codeInvitation}
              setCodeInvitation={setCodeInvitation}
              handleJoinEquipe={handleJoinEquipe}
              messageRejoindre={messageRejoindre}
              mesStructures={mesStructures}
              handleOpenStructure={handleOpenStructure}
              mesEquipes={mesEquipes}
              handleOpenEquipe={handleOpenEquipe}
              selectedStructure={selectedStructure}
              equipesStructure={equipesStructure}
              selectedEquipe={selectedEquipe}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              membresEquipe={membresEquipe}
              user={user}
              handleOpenCoachStats={handleOpenCoachStats}
              handlePromote={handlePromote}
              handleRemove={handleRemove}
              handleBan={handleBan}
              handleUnban={handleUnban}
              bannisEquipe={bannisEquipe}
              handleLeaveEquipe={handleLeaveEquipe}
              handleRenameEquipe={handleRenameEquipe}
              handleClearEquipePlayers={handleClearEquipePlayers}
              handleDeleteEquipe={handleDeleteEquipe}
              setCreateType={setCreateType}
              setSelectedStructureIdForNewTeam={setSelectedStructureIdForNewTeam}
              setShowCreateModal={setShowCreateModal}
              setOnboardingStats={setOnboardingStats}
              setShowOnboardingModal={setShowOnboardingModal}
              demandesEquipe={demandesEquipe}
              handleToggleEquipeAccess={handleToggleEquipeAccess}
              handleAcceptDemande={handleAcceptDemande}
              handleRejectDemande={handleRejectDemande}
              setPendingJoinEquipe={setPendingJoinEquipe}
            />
          )}

          {activeTab === 'calendrier' && (
            <AgendaView
              isCoachOfAnyTeam={isCoachOfAnyTeam}
              openCreateEventModal={openCreateEventModal}
              evenements={evenements}
              mesEquipes={mesEquipes}
              presencesGlobales={presencesGlobales}
              mesPresences={mesPresences}
              openEditEventModal={openEditEventModal}
              handleDeleteEvent={handleDeleteEvent}
              handlePresence={handlePresence}
              handleGenerateFromEvent={handleGenerateFromEvent}
              confirmationPresence={confirmationPresence}
              evenements7Jours={evenements7Jours}
            />
          )}

          {activeTab === 'generateur' && (
            <GenerateurView
              algoStep={algoStep}
              setAlgoStep={setAlgoStep}
              mesEquipes={mesEquipes}
              selectedTeamsForAlgo={selectedTeamsForAlgo}
              toggleTeamSelection={toggleTeamSelection}
              handleGoToStep2={handleGoToStep2}
              handleSelectModeAndConfigure={handleSelectModeAndConfigure}
              algoMode={algoMode}
              algoConfig={algoConfig}
              setAlgoConfig={setAlgoConfig}
              poolOfPlayers={poolOfPlayers}
              compositionsSauvegardees={compositionsSauvegardees}
              handleSaveComposition={handleSaveComposition}
              handleOpenSavedComposition={handleOpenSavedComposition}
              handleDeleteComposition={handleDeleteComposition}
              loadedComposition={loadedComposition}
              setLoadedComposition={setLoadedComposition}
            />
          )}

          {activeTab === 'profil' && (
            <ProfilView
              messageProfil={messageProfil}
              photoUrl={photoUrl}
              isEditingProfile={isEditingProfile}
              setIsEditingProfile={setIsEditingProfile}
              handlePhotoUpload={handlePhotoUpload}
              prenom={prenom}
              setPrenom={setPrenom}
              nom={nom}
              setNom={setNom}
              poste={poste}
              user={user}
              handleSaveProfile={handleSaveProfile}
              handleLogout={handleLogout}
              handleDeleteAccount={handleDeleteAccount}
            />
          )}
        </div>

        {/* Modales globales */}
        <OnboardingModal
        show={showOnboardingModal}
        onClose={() => {
          setShowOnboardingModal(false);
          setPendingJoinEquipe(null);
        }}
        onboardingStats={onboardingStats}
        setOnboardingStats={setOnboardingStats}
        handleSaveOnboarding={handleSaveOnboarding}
        statsFields={statsFields}
        pendingJoinEquipe={pendingJoinEquipe}
      />

        <CoachStatsModal
          show={showCoachStatsModal}
          onClose={() => setShowCoachStatsModal(false)}
          editingMembre={editingMembre}
          coachStats={coachStats}
          setCoachStats={setCoachStats}
          handleSaveCoachStats={handleSaveCoachStats}
          statsFields={statsFields}
        />

        <CreateGroupModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          createType={createType}
          setCreateType={setCreateType}
          mesStructures={mesStructures}
          nomStructure={nomStructure}
          setNomStructure={setNomStructure}
          handleCreateStructure={handleCreateStructure}
          selectedStructureIdForNewTeam={selectedStructureIdForNewTeam}
          setSelectedStructureIdForNewTeam={setSelectedStructureIdForNewTeam}
          nomNouvelleEquipe={nomNouvelleEquipe}
          setNomNouvelleEquipe={setNomNouvelleEquipe}
          handleCreateEquipe={handleCreateEquipe}
          messageCreation={messageCreation}
        />

        <EventModal
          show={showEventModal}
          onClose={() => setShowEventModal(false)}
          editingEventId={editingEventId}
          eventFormData={eventFormData}
          setEventFormData={setEventFormData}
          mesEquipes={mesEquipes}
          handleSaveEvent={handleSaveEvent}
        />

        {/* Barre de navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setCurrentView={setCurrentView}
          setAlgoStep={setAlgoStep}
          isCoachOfAnyTeam={isCoachOfAnyTeam}
          notifAgendaCount={notifAgendaCount}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">🏐 Volley Coach</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {authInfoMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
            {authInfoMessage}
          </div>
        )}

        {isForgotPasswordMode ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-xs text-gray-500">
              Entre l'adresse e-mail associée à ton compte pour recevoir un lien de réinitialisation de mot de passe.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ton adresse e-mail"
              className="w-full border border-gray-300 rounded-xl px-4 py-3"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all"
            >
              Envoyer le lien de réinitialisation
            </button>
            <button
              type="button"
              onClick={() => {
                setIsForgotPasswordMode(false);
                setError('');
                setAuthInfoMessage('');
              }}
              className="w-full text-center text-sm text-indigo-600 font-bold hover:underline pt-1"
            >
              ← Retour à la connexion
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              />

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                {isLoginMode ? 'Se connecter' : 'Créer un compte'}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                  setAuthInfoMessage('');
                }}
                className="text-indigo-600 font-bold hover:underline"
              >
                {isLoginMode ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
              </button>

              {isLoginMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(true);
                    setError('');
                    setAuthInfoMessage('');
                  }}
                  className="text-gray-500 font-semibold hover:text-blue-600 hover:underline text-xs"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <button
                onClick={handleGoogle}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Se connecter avec Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;