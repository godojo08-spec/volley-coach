import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  getAuth,
  deleteUser
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
  const [onboardingMembreId, setOnboardingMembreId] = useState('');
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        const docSnap = await getDoc(doc(db, 'utilisateurs', currentUser.uid));
        if (docSnap.exists()) {
          setNom(docSnap.data().nom || '');
          setPrenom(docSnap.data().prenom || '');
          setPoste(docSnap.data().poste || '');
          setPhotoUrl(docSnap.data().photoURL || '');
        }
        fetchMesDonnees(currentUser.uid);
        fetchCompositions(currentUser.uid)
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
      }
    });
    return () => unsubscribe();
  }, []);

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

      const eventsData = snapEvents.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(`${a.date}T${a.heure}`) - new Date(`${b.date}T${b.heure}`));

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinEquipe = async e => {
    e.preventDefault();
    setMessageRejoindre('');
    try {
      const codeNettoye = codeInvitation.trim();
      const eqSnap = await getDoc(doc(db, 'equipes', codeNettoye));
      if (!eqSnap.exists()) {
        setMessageRejoindre('❌ Code invalide.');
        return;
      }

      // Vérification si l'utilisateur est banni de cette équipe
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

      // Vérification si déjà dans l'équipe
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

      const newMembreRef = await addDoc(collection(db, 'membres'), {
        utilisateurId: user.uid,
        cibleId: codeNettoye,
        type: 'equipe',
        isCoach: false,
        isJoueur: true
      });
      setOnboardingMembreId(newMembreRef.id);
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
      setMessageRejoindre('❌ Erreur lors de la tentative de connexion.');
    }
  };

  const handleSaveOnboarding = async e => {
    e.preventDefault();
    try {
      await setDoc(
        doc(db, 'membres', onboardingMembreId),
        {
          isJoueur: true,
          poste1: onboardingStats.poste1,
          poste2: onboardingStats.poste2,
          stats: {
            attaque: onboardingStats.attaque,
            reception: onboardingStats.reception,
            passe: onboardingStats.passe,
            bloc: onboardingStats.bloc,
            defense: onboardingStats.defense,
            service: onboardingStats.service
          }
        },
        { merge: true }
      );
      await setDoc(
        doc(db, 'utilisateurs', user.uid),
        { email: user.email, nom: nom || '', prenom: prenom || '', poste: onboardingStats.poste1 },
        { merge: true }
      );
      setPoste(onboardingStats.poste1);
      setShowOnboardingModal(false);
      fetchMesDonnees(user.uid);
      if (selectedEquipe) handleOpenEquipe(selectedEquipe);
    } catch (err) {
      console.error(err);
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

  const handleAuth = async e => {
    e.preventDefault();
    setError('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message || "Erreur d'authentification.");
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err.message || 'Erreur avec Google.');
    }
  };

  const handleLogout = () => signOut(auth);

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
              setCreateType={setCreateType}
              setSelectedStructureIdForNewTeam={setSelectedStructureIdForNewTeam}
              setShowCreateModal={setShowCreateModal}
              setOnboardingMembreId={setOnboardingMembreId}
              setOnboardingStats={setOnboardingStats}
              setShowOnboardingModal={setShowOnboardingModal}
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
          onboardingStats={onboardingStats}
          setOnboardingStats={setOnboardingStats}
          handleSaveOnboarding={handleSaveOnboarding}
          statsFields={statsFields}
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

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">{error}</div>}

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

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all">
            {isLoginMode ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-indigo-600 font-bold hover:underline">
            {isLoginMode ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
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
      </div>
    </div>
  );
}

export default App;