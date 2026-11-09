import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
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
  const defaultEventState = { titre: 'Entraînement', date: '', heure: '20:00', type: 'Entraînement', equipeIds: [] };
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState(defaultEventState);
  const [editingEventId, setEditingEventId] = useState(null);

  const [algoStep, setAlgoStep] = useState(1);
  const [selectedTeamsForAlgo, setSelectedTeamsForAlgo] = useState([]);
  const [algoMode, setAlgoMode] = useState(null);
  const [poolOfPlayers, setPoolOfPlayers] = useState([]);
  const [algoConfig, setAlgoConfig] = useState({ numTeams: 2, playersPerTeam: 6, lockedRoles: {} });

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
      } else {
        setNom('');
        setPrenom('');
        setPoste('Réceptionneur-Attaquant (R4)');
        setPhotoUrl('');
        setMesStructures([]);
        setMesEquipes([]);
        setSelectedStructure(null);
        setSelectedEquipe(null);
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

      for (const ev of eventsData) {
        globalPres[ev.id] = { present: 0, absent: 0, joueursPresents: [] };
        const qP = query(collection(db, 'presences'), where('evenementId', '==', ev.id));
        const snapP = await getDocs(qP);

        snapP.docs.forEach(docP => {
          const pData = docP.data();
          if (pData.utilisateurId === user.uid) myPres[ev.id] = pData.statut;
          if (pData.statut === 'present') {
            globalPres[ev.id].present++;
            globalPres[ev.id].joueursPresents.push(pData.utilisateurId);
          }
          if (pData.statut === 'absent') globalPres[ev.id].absent++;
        });
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
          membresTemp.push({
            id: userSnap.id,
            membreDocId: d.id,
            isCoach,
            isJoueur,
            email: userSnap.data().email,
            posteEquipe: lien.coachPoste || lien.poste1 || userSnap.data().poste,
            stats: lien.coachStats || lien.stats || null,
            ...userSnap.data()
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinEquipe = async e => {
    e.preventDefault();
    try {
      const eqSnap = await getDoc(doc(db, 'equipes', codeInvitation));
      if (!eqSnap.exists()) {
        setMessageRejoindre('❌ Code invalide.');
        return;
      }
      const newMembreRef = await addDoc(collection(db, 'membres'), {
        utilisateurId: user.uid,
        cibleId: codeInvitation,
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
      setMessageRejoindre('❌ Erreur.');
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
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromote = async (membre, mode) => {
    try {
      await updateDoc(doc(db, 'membres', membre.membreDocId), { isCoach: true, isJoueur: mode === 'Coach + Joueur' });
      setOpenMenuId(null);
      handleOpenEquipe(selectedEquipe);
    } catch (err) {}
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

  const handleOpenCoachStats = membre => {
    setEditingMembre(membre);
    const baseStats = membre.stats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 };
    setCoachStats({ posteEquipe: membre.coachPoste || membre.posteEquipe || 'Polyvalent', ...baseStats });
    setOpenMenuId(null);
    setShowCoachStatsModal(true);
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
        }
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
    setAlgoMode(mode);
    setAlgoStep(3);
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
              setCreateType={setCreateType}
              setSelectedStructureIdForNewTeam={setSelectedStructureIdForNewTeam}
              setShowCreateModal={setShowCreateModal}
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