import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore'; 
import { auth, db } from './firebase'; 
import { Home, Calendar, User, Plus, ChevronRight, UserPlus, CheckCircle2, MoreVertical, Wand2, Settings, CalendarDays, Clock, Users, Edit2, Trash2 } from 'lucide-react';
import TeamGenerator from './TeamGenerator';
import { mockPlayers } from './mockPlayers'; 

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

  // ==========================================
  // ÉTATS DE CRÉATION UNIFIÉE (Structure / Équipe)
  // ==========================================
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('structure'); 
  const [nomNouvelleEquipe, setNomNouvelleEquipe] = useState('');
  const [selectedStructureIdForNewTeam, setSelectedStructureIdForNewTeam] = useState('');

  const [showOnboardingModal, setShowOnboardingModal] = useState(false); 
  const [onboardingMembreId, setOnboardingMembreId] = useState(''); 
  const [onboardingStats, setOnboardingStats] = useState({ poste1: 'Réceptionneur-Attaquant (R4)', poste2: 'Polyvalent', attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 });

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCoachStatsModal, setShowCoachStatsModal] = useState(false);
  const [editingMembre, setEditingMembre] = useState(null);
  const [coachStats, setCoachStats] = useState({ posteEquipe: 'Réceptionneur-Attaquant (R4)', attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 });

  // Agenda
  const [evenements, setEvenements] = useState([]);
  const [mesPresences, setMesPresences] = useState({}); 
  const [presencesGlobales, setPresencesGlobales] = useState({}); 
  const defaultEventState = { titre: 'Entraînement', date: '', heure: '20:00', type: 'Entraînement', equipeIds: [] };
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState(defaultEventState);
  const [editingEventId, setEditingEventId] = useState(null);

  // Générateur
  const [algoStep, setAlgoStep] = useState(1); 
  const [selectedTeamsForAlgo, setSelectedTeamsForAlgo] = useState([]); 
  const [algoMode, setAlgoMode] = useState(null); 
  const [poolOfPlayers, setPoolOfPlayers] = useState([]);
  const [algoConfig, setAlgoConfig] = useState({ numTeams: 2, playersPerTeam: 6, lockedRoles: {} });

  // ==========================================
  // INITIALISATION
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docSnap = await getDoc(doc(db, 'utilisateurs', currentUser.uid));
        if (docSnap.exists()) {
          setNom(docSnap.data().nom || ''); setPrenom(docSnap.data().prenom || ''); 
          setPoste(docSnap.data().poste || ''); setPhotoUrl(docSnap.data().photoURL || ''); 
        }
        fetchMesDonnees(currentUser.uid);
      } else {
        setNom(''); setPrenom(''); setPoste('Réceptionneur-Attaquant (R4)'); setPhotoUrl('');
        setMesStructures([]); setMesEquipes([]); setSelectedStructure(null); setSelectedEquipe(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchMesDonnees = async (uid) => {
    try {
      const qMembres = query(collection(db, 'membres'), where('utilisateurId', '==', uid));
      const querySnapshot = await getDocs(qMembres);
      const structuresTemp = []; const equipesTemp = [];

      for (const docMembre of querySnapshot.docs) {
        const lien = docMembre.data();
        const isCoach = lien.isCoach ?? (lien.role === 'coach');
        const isJoueur = lien.isJoueur ?? (lien.role === 'joueur');

        if (lien.type === 'structure') {
          const snap = await getDoc(doc(db, 'structures', lien.cibleId));
          if (snap.exists()) structuresTemp.push({ id: snap.id, isCoach, isJoueur, ...snap.data() });
        } else if (lien.type === 'equipe') {
          const snap = await getDoc(doc(db, 'equipes', lien.cibleId));
          if (snap.exists()) equipesTemp.push({ id: snap.id, isCoach, isJoueur, ...snap.data() });
        }
      }
      setMesStructures(structuresTemp); setMesEquipes(equipesTemp);
    } catch (err) { console.error(err); }
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
    } catch(e) { console.error("Erreur Agenda:", e) }
  };

  // ==========================================
  // FONCTIONS AGENDA & PRÉSENCES
  // ==========================================
  const openCreateEventModal = () => { setEventFormData(defaultEventState); setEditingEventId(null); setShowEventModal(true); };
  const openEditEventModal = (ev) => { setEventFormData({ titre: ev.titre, date: ev.date, heure: ev.heure, type: ev.type, equipeIds: ev.equipeIds || [] }); setEditingEventId(ev.id); setShowEventModal(true); };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventFormData.equipeIds || eventFormData.equipeIds.length === 0) return alert("Veuillez sélectionner au moins une équipe.");
    try {
       if (editingEventId) await updateDoc(doc(db, 'evenements', editingEventId), { ...eventFormData });
       else await addDoc(collection(db, 'evenements'), { ...eventFormData, createurId: user.uid, dateCreation: new Date().toISOString() });
       setShowEventModal(false); setEventFormData(defaultEventState); setEditingEventId(null); fetchAgenda();
    } catch (err) { console.error(err) }
  };

  const handleDeleteEvent = async (eventId) => {
    if(window.confirm("Es-tu sûr de vouloir annuler et supprimer cet événement ?")) {
        try { await deleteDoc(doc(db, 'evenements', eventId)); fetchAgenda(); } catch (err) { console.error(err) }
    }
  };

  const handlePresence = async (eventId, statut) => {
    try {
      const docId = `${eventId}_${user.uid}`; 
      await setDoc(doc(db, 'presences', docId), { evenementId: eventId, utilisateurId: user.uid, statut, dateReponse: new Date().toISOString() }, { merge: true });
      fetchAgenda(); 
    } catch(err) { console.error(err) }
  };

  const handleGenerateFromEvent = async (event) => {
    const presentIds = presencesGlobales[event.id]?.joueursPresents || [];
    if (presentIds.length === 0) return alert('Aucun joueur présent pour générer une équipe.');
    try {
      let allPlayers = [];
      for (const tId of (event.equipeIds || [])) {
        const qMembres = query(collection(db, 'membres'), where('cibleId', '==', tId), where('type', '==', 'equipe'));
        const snap = await getDocs(qMembres);
        for (const d of snap.docs) {
          const lien = d.data();
          if (lien.isJoueur && presentIds.includes(lien.utilisateurId)) {
            if (!allPlayers.find(p => p.id === lien.utilisateurId)) {
                const userSnap = await getDoc(doc(db, 'utilisateurs', lien.utilisateurId));
                if (userSnap.exists()) {
                  allPlayers.push({
                    id: userSnap.id, prenom: userSnap.data().prenom || 'Joueur', nom: userSnap.data().nom || '',
                    photoURL: userSnap.data().photoURL || '',
                    posteEquipe: lien.coachPoste || lien.poste1 || userSnap.data().poste || 'Polyvalent',
                    stats: lien.coachStats || lien.stats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 }
                  });
                }
            }
          }
        }
      }
      setPoolOfPlayers(allPlayers); setSelectedTeamsForAlgo(event.equipeIds || []); setAlgoStep(2); setActiveTab('generateur');
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // FONCTIONS DE CRÉATION UNIFIÉES
  // ==========================================
  const handleCreateStructure = async (e) => { 
    e.preventDefault(); 
    try { 
      const structRef = await addDoc(collection(db, 'structures'), { nom: nomStructure, createurId: user.uid, dateCreation: new Date() }); 
      await addDoc(collection(db, 'membres'), { utilisateurId: user.uid, cibleId: structRef.id, type: 'structure', isCoach: true, isJoueur: false }); 
      setMessageCreation('✅ Structure créée !'); 
      setTimeout(() => { 
        setMessageCreation(''); 
        setNomStructure('');
        setShowCreateModal(false);
        setCurrentView('main');
        fetchMesDonnees(user.uid); 
      }, 1500); 
    } catch (err) { setMessageCreation("❌ Erreur lors de la création."); } 
  };

  const handleCreateEquipe = async (e) => { 
    e.preventDefault(); 
    if (!selectedStructureIdForNewTeam) return alert("Veuillez sélectionner une structure parente.");
    try { 
      const struct = mesStructures.find(s => s.id === selectedStructureIdForNewTeam);
      const eqRef = await addDoc(collection(db, 'equipes'), { nom: nomNouvelleEquipe, structureId: struct.id, nomStructure: struct.nom, createurId: user.uid, dateCreation: new Date() }); 
      
      // Le créateur de l'équipe est toujours et d'office Coach (isJoueur: false)
      await addDoc(collection(db, 'membres'), { utilisateurId: user.uid, cibleId: eqRef.id, type: 'equipe', isCoach: true, isJoueur: false }); 
      
      setMessageCreation('✅ Équipe créée !'); 
      setTimeout(() => { 
        setMessageCreation('');
        setNomNouvelleEquipe('');
        setShowCreateModal(false);
        fetchMesDonnees(user.uid); 
        
        // Rafraîchit l'affichage si on est déjà dans la structure concernée
        if (currentView === 'detail_structure' && selectedStructure?.id === struct.id) {
          handleOpenStructure(struct);
        }
      }, 1500); 
    } catch (err) { console.error(err); } 
  };

  // ==========================================
  // GESTION NAVIGATION ET EFFECTIF
  // ==========================================
  const handleOpenStructure = async (struct) => { 
    setSelectedStructure(struct); setCurrentView('detail_structure'); 
    try { 
      const qEquipes = query(collection(db, 'equipes'), where('structureId', '==', struct.id)); 
      const snap = await getDocs(qEquipes); 
      setEquipesStructure(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    } catch (err) { console.error(err); } 
  };

  const handleOpenEquipe = async (equipe) => { 
    setSelectedEquipe(equipe); setCurrentView('detail_equipe'); setOpenMenuId(null); 
    try { 
      const qMembres = query(collection(db, 'membres'), where('cibleId', '==', equipe.id), where('type', '==', 'equipe')); 
      const snap = await getDocs(qMembres); 
      const membresTemp = []; 
      for (const d of snap.docs) { 
        const lien = d.data(); 
        const userSnap = await getDoc(doc(db, 'utilisateurs', lien.utilisateurId)); 
        const isCoach = lien.isCoach ?? (lien.role === 'coach'); 
        const isJoueur = lien.isJoueur ?? (lien.role === 'joueur'); 
        if (userSnap.exists()) { 
          membresTemp.push({ id: userSnap.id, membreDocId: d.id, isCoach, isJoueur, email: userSnap.data().email, posteEquipe: lien.coachPoste || lien.poste1 || userSnap.data().poste, stats: lien.coachStats || lien.stats || null, ...userSnap.data() }); 
        } else { 
          membresTemp.push({ id: lien.utilisateurId, membreDocId: d.id, isCoach, isJoueur, prenom: 'Nouveau', nom: 'Joueur', posteEquipe: 'Inconnu' }); 
        } 
      } 
      setMembresEquipe(membresTemp); 
    } catch (err) { console.error(err); } 
  };

  const handleJoinEquipe = async (e) => { 
    e.preventDefault(); 
    try { 
      const eqSnap = await getDoc(doc(db, 'equipes', codeInvitation)); 
      if (!eqSnap.exists()) { setMessageRejoindre("❌ Code invalide."); return; } 
      const newMembreRef = await addDoc(collection(db, 'membres'), { utilisateurId: user.uid, cibleId: codeInvitation, type: 'equipe', isCoach: false, isJoueur: true }); 
      setOnboardingMembreId(newMembreRef.id); 
      setShowOnboardingModal(true); 
      setCodeInvitation(''); 
    } catch (err) { setMessageRejoindre("❌ Erreur."); } 
  };

  const handleSaveOnboarding = async (e) => { 
    e.preventDefault(); 
    try { 
      await setDoc(doc(db, 'membres', onboardingMembreId), { isJoueur: true, poste1: onboardingStats.poste1, poste2: onboardingStats.poste2, stats: { attaque: onboardingStats.attaque, reception: onboardingStats.reception, passe: onboardingStats.passe, bloc: onboardingStats.bloc, defense: onboardingStats.defense, service: onboardingStats.service } }, { merge: true }); 
      await setDoc(doc(db, 'utilisateurs', user.uid), { email: user.email, nom: nom || '', prenom: prenom || '', poste: onboardingStats.poste1 }, { merge: true }); 
      setPoste(onboardingStats.poste1); 
      setShowOnboardingModal(false); 
      fetchMesDonnees(user.uid); 
    } catch (err) { console.error(err); } 
  };

  const handlePromote = async (membre, mode) => { 
    try { 
      await updateDoc(doc(db, 'membres', membre.membreDocId), { isCoach: true, isJoueur: mode === 'Coach + Joueur' }); 
      setOpenMenuId(null); 
      handleOpenEquipe(selectedEquipe); 
    } catch (err) {} 
  };

  const handleRemove = async (membre) => { 
    if (window.confirm(`Sûr de vouloir retirer ${membre.prenom} de l'équipe ?`)) {
      try { await deleteDoc(doc(db, 'membres', membre.membreDocId)); setOpenMenuId(null); handleOpenEquipe(selectedEquipe); } catch (err) {} 
    }
  };

  const handleOpenCoachStats = (membre) => { 
    setEditingMembre(membre); 
    const baseStats = membre.stats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 }; 
    setCoachStats({ posteEquipe: membre.posteEquipe || membre.poste1 || 'Polyvalent', ...baseStats }); 
    setOpenMenuId(null); 
    setShowCoachStatsModal(true); 
  };

  const handleSaveCoachStats = async (e) => { 
    e.preventDefault(); 
    try { 
      await updateDoc(doc(db, 'membres', editingMembre.membreDocId), { 
        coachPoste: coachStats.posteEquipe, 
        coachStats: { attaque: coachStats.attaque, reception: coachStats.reception, passe: coachStats.passe, bloc: coachStats.bloc, defense: coachStats.defense, service: coachStats.service } 
      }); 
      setShowCoachStatsModal(false); 
      handleOpenEquipe(selectedEquipe); 
    } catch (err) { console.error(err); } 
  };

  // ==========================================
  // GÉNÉRATEUR ET PROFIL
  // ==========================================
  const toggleTeamSelection = (equipeId) => { setSelectedTeamsForAlgo(prev => prev.includes(equipeId) ? prev.filter(id => id !== equipeId) : [...prev, equipeId] ); };
  const handleSelectModeAndConfigure = async (mode) => { setAlgoMode(mode); try { let allPlayers = []; for (const teamId of selectedTeamsForAlgo) { const qMembres = query(collection(db, 'membres'), where('cibleId', '==', teamId), where('type', 'equipe')); const snap = await getDocs(qMembres); for (const d of snap.docs) { const lien = d.data(); if (lien.isJoueur) { const userSnap = await getDoc(doc(db, 'utilisateurs', lien.utilisateurId)); if (userSnap.exists() && !allPlayers.find(p => p.id === userSnap.id)) { allPlayers.push({ id: userSnap.id, prenom: userSnap.data().prenom || 'Joueur', nom: userSnap.data().nom || '', photoURL: userSnap.data().photoURL || '', posteEquipe: lien.coachPoste || lien.poste1 || userSnap.data().poste || 'Polyvalent', stats: lien.coachStats || lien.stats || { attaque: 5, reception: 5, passe: 5, bloc: 5, defense: 5, service: 5 } }); } } } } if (allPlayers.length === 0) allPlayers = [...mockPlayers]; setPoolOfPlayers(allPlayers); setAlgoStep(3); } catch (err) { console.error(err); } };
  const handleSaveProfile = async (e) => { e.preventDefault(); try { await setDoc(doc(db, 'utilisateurs', user.uid), { nom, prenom, poste, email: user.email, photoURL: photoUrl }, { merge: true }); setMessageProfil('✅ Profil mis à jour !'); setIsEditingProfile(false); setTimeout(() => setMessageProfil(''), 3000); } catch (err) {} };
  const handlePhotoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setPhotoUrl(reader.result); reader.readAsDataURL(file); } };
  
  const handleAuth = async (e) => { e.preventDefault(); setError(''); try { if (isLoginMode) { await signInWithEmailAndPassword(auth, email, password); } else { await createUserWithEmailAndPassword(auth, email, password); } } catch (err) { setError(err.message || "Erreur d'authentification."); } };
  const handleGoogle = async () => { setError(''); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { setError(err.message || "Erreur avec Google."); } };
  const handleLogout = () => signOut(auth);

  if (user) {
    const isCoachOfAnyTeam = mesEquipes.some(eq => eq.isCoach);

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <div className="flex-grow pb-24"> 
          {/* ========================================== ONGLET ACCUEIL ========================================== */}
          {activeTab === 'accueil' && (
            <div className="animate-fade-in p-4 relative min-h-screen">
              {currentView === 'main' && (
                <>
                  <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-gray-800">Mes Groupes</h1><div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">{prenom ? prenom.charAt(0).toUpperCase() : 'U'}</div></div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6"><h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><UserPlus size={16}/> Rejoindre une équipe</h2><form onSubmit={handleJoinEquipe} className="flex gap-2"><input type="text" value={codeInvitation} onChange={(e) => setCodeInvitation(e.target.value)} placeholder="Code d'invitation..." className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm" required /><button type="submit" className="bg-gray-800 text-white font-bold px-4 rounded-lg text-sm">Rejoindre</button></form></div>
                  {messageRejoindre && <p className="text-xs font-bold text-center mb-4 text-indigo-600">{messageRejoindre}</p>}
                  {mesStructures.length > 0 && (<div className="mb-6"><h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Structures (Espace Coach)</h2><div className="space-y-3">{mesStructures.map(struct => (<div key={struct.id} onClick={() => handleOpenStructure(struct)} className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-xl shadow-md text-white flex justify-between items-center cursor-pointer"><div><p className="font-bold text-xl">{struct.nom}</p></div><ChevronRight className="text-blue-200" /></div>))}</div></div>)}
                  {mesEquipes.length > 0 && (<div><h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Mes Équipes</h2><div className="space-y-3">{mesEquipes.map(eq => (<div key={eq.id} onClick={() => handleOpenEquipe(eq)} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer"><div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{eq.nomStructure}</p><p className="font-bold text-gray-800">{eq.nom}</p></div><div className="flex flex-col gap-1 items-end">{eq.isCoach && <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">Coach</span>}{eq.isJoueur && <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-100">Joueur</span>}</div></div>))}</div></div>)}
                </>
              )}
              {currentView === 'detail_structure' && selectedStructure && (
                <div className="animate-fade-in">
                  <button onClick={() => setCurrentView('main')} className="text-blue-600 text-sm font-bold mb-4 flex items-center">← Retour</button>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl shadow-md text-white mb-6"><h2 className="text-3xl font-bold">{selectedStructure.nom}</h2></div>
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800 text-lg">Équipes</h3></div>
                  <div className="space-y-3">{equipesStructure.map(eq => (<div key={eq.id} onClick={() => handleOpenEquipe(eq)} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer"><p className="font-bold text-gray-800 text-lg">{eq.nom}</p><ChevronRight className="text-gray-400" /></div>))}</div>
                  {equipesStructure.length === 0 && <p className="text-sm text-gray-500 italic mt-4 bg-white p-4 rounded-xl text-center">Aucune équipe dans cette structure.<br/>Utilise le bouton bleu en bas à droite pour en créer une.</p>}
                </div>
              )}
              {currentView === 'detail_equipe' && selectedEquipe && (
                <div className="animate-fade-in relative">
                  {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>}
                  <button onClick={() => setCurrentView('main')} className="text-blue-600 text-sm font-bold mb-4">← Retour</button>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 border-l-4 border-l-blue-500"><h2 className="text-2xl font-bold text-gray-800">{selectedEquipe.nom}</h2><p className="text-xs text-gray-500 mt-1">Code d'invitation : <span className="font-mono bg-gray-100 px-1 py-0.5 rounded select-all font-bold">{selectedEquipe.id}</span></p></div>
                  <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">Staff & Coachs</h3>
                  <div className="space-y-3 mb-8">{membresEquipe.filter(m => m.isCoach).map(membre => (<div key={membre.id} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center"><p className="font-bold text-indigo-900">{membre.prenom} {membre.nom}</p></div>))}</div>
                  <h3 className="font-bold text-gray-800 text-lg mb-3">Effectif</h3>
                  <div className="space-y-3 mb-10">{membresEquipe.filter(m => m.isJoueur).map(membre => (<div key={membre.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center relative"><div><p className="font-bold text-gray-800">{membre.prenom} {membre.nom}</p><p className="text-xs text-gray-500">{membre.coachPoste || membre.posteEquipe}</p></div>{membresEquipe.find(m => m.id === user.uid)?.isCoach && (<div className="relative z-20"><button onClick={() => setOpenMenuId(openMenuId === membre.id ? null : membre.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><MoreVertical size={20} /></button>{openMenuId === membre.id && (<div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden py-1"><button onClick={() => handleOpenCoachStats(membre)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50">📊 Éditer les stats</button><button onClick={() => handlePromote(membre, 'Coach + Joueur')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50">👑 Promouvoir</button><button onClick={() => handleRemove(membre)} className="w-full text-left px-4 py-3 text-sm text-red-600">❌ Retirer</button></div>)}</div>)}</div>))}</div>
                </div>
              )}

              {/* BOUTON + FLOTTANT GLOBAL DANS L'ONGLET ACCUEIL */}
              {currentView !== 'detail_equipe' && (
                <button 
                  onClick={() => {
                      if (currentView === 'detail_structure' && selectedStructure) {
                          setCreateType('equipe');
                          setSelectedStructureIdForNewTeam(selectedStructure.id);
                      } else {
                          setCreateType('structure');
                          if (mesStructures.length > 0) setSelectedStructureIdForNewTeam(mesStructures[0].id);
                      }
                      setShowCreateModal(true);
                  }} 
                  className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg z-40 hover:bg-blue-700 transition-all"
                >
                  <Plus size={28} />
                </button>
              )}
            </div>
          )}

          {/* ========================================== MODALES MANQUANTES (ONBOARDING & COACH STATS) ========================================== */}
          {showOnboardingModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Ton profil Joueur</h2>
                <form onSubmit={handleSaveOnboarding} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Poste principal</label>
                    <select value={onboardingStats.poste1} onChange={e => setOnboardingStats({...onboardingStats, poste1: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 font-medium">
                      <option value="Passeur (P)">Passeur (P)</option>
                      <option value="Pointu (Pt)">Pointu (Pt)</option>
                      <option value="Réceptionneur-Attaquant (R4)">Réceptionneur-Attaquant (R4)</option>
                      <option value="Central (C)">Central (C)</option>
                      <option value="Libéro (L)">Libéro (L)</option>
                      <option value="Polyvalent">Polyvalent</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700">Rejoindre l'équipe</button>
                </form>
              </div>
            </div>
          )}

          {showCoachStatsModal && editingMembre && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Stats de {editingMembre.prenom}</h2>
                <form onSubmit={handleSaveCoachStats} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Poste assigné (Coach)</label>
                    <select value={coachStats.posteEquipe} onChange={e => setCoachStats({...coachStats, posteEquipe: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 font-medium">
                      <option value="Passeur (P)">Passeur (P)</option>
                      <option value="Pointu (Pt)">Pointu (Pt)</option>
                      <option value="Réceptionneur-Attaquant (R4)">Réceptionneur-Attaquant (R4)</option>
                      <option value="Central (C)">Central (C)</option>
                      <option value="Libéro (L)">Libéro (L)</option>
                      <option value="Polyvalent">Polyvalent</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowCoachStatsModal(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-lg">Annuler</button>
                    <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg">Enregistrer</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================== MODALE DE CRÉATION UNIFIÉE ========================================== */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up relative">
                <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Créer un groupe</h2>

                {mesStructures.length > 0 && (
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        <button type="button" onClick={() => setCreateType('structure')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${createType === 'structure' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Structure</button>
                        <button type="button" onClick={() => setCreateType('equipe')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${createType === 'equipe' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Équipe</button>
                    </div>
                )}

                {messageCreation && <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm font-bold rounded-lg text-center">{messageCreation}</div>}

                {createType === 'structure' ? (
                  <form onSubmit={handleCreateStructure} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom de la structure</label>
                      <input type="text" value={nomStructure} onChange={e => setNomStructure(e.target.value)} placeholder="Ex: Volley Club Paris" className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700">Créer la structure</button>
                  </form>
                ) : (
                  <form onSubmit={handleCreateEquipe} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Structure parente</label>
                      <select value={selectedStructureIdForNewTeam} onChange={e => setSelectedStructureIdForNewTeam(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 font-medium" required>
                        {mesStructures.map(s => (
                          <option key={s.id} value={s.id}>{s.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom de l'équipe</label>
                      <input type="text" value={nomNouvelleEquipe} onChange={e => setNomNouvelleEquipe(e.target.value)} placeholder="Ex: M18 Masc" className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700">Créer l'équipe</button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ========================================== RESTE DU CODE (AGENDA, GÉNÉRATEUR, PROFIL) ========================================== */}
          {activeTab === 'calendrier' && (
            <div className="animate-fade-in p-4 relative min-h-screen">
              <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-gray-800">Agenda</h1><p className="text-sm text-gray-500">Gère tes présences</p></div>
                {isCoachOfAnyTeam && (<button onClick={openCreateEventModal} className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all"><Plus size={24} /></button>)}
              </div>

              {evenements.length === 0 ? (
                <p className="text-gray-500 text-sm mt-10 text-center">Aucun événement prévu.</p>
              ) : (
                <div className="space-y-4">
                  {evenements.map(ev => {
                    const eqs = mesEquipes.filter(e => (ev.equipeIds || []).includes(e.id));
                    if (eqs.length === 0) return null;
                    const isCoachForEvent = eqs.some(e => e.isCoach);
                    const isJoueurForEvent = eqs.some(e => e.isJoueur);
                    const stats = presencesGlobales[ev.id] || { present: 0, absent: 0 };
                    const monStatut = mesPresences[ev.id];

                    return (
                      <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className={`p-4 border-b ${ev.type === 'Match' ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800 text-lg">{ev.titre}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${ev.type === 'Match' ? 'bg-orange-200 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{ev.type}</span>
                                {isCoachForEvent && (
                                    <div className="flex gap-1 ml-1">
                                        <button onClick={() => openEditEventModal(ev)} className="p-1.5 bg-white text-gray-500 rounded hover:text-indigo-600 shadow-sm border border-gray-200"><Edit2 size={12}/></button>
                                        <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 bg-white text-gray-500 rounded hover:text-red-600 shadow-sm border border-gray-200"><Trash2 size={12}/></button>
                                    </div>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-gray-500">
                            <span className="flex items-center gap-1"><CalendarDays size={14}/> {new Date(ev.date).toLocaleDateString('fr-FR')}</span>
                            <span className="flex items-center gap-1"><Clock size={14}/> {ev.heure}</span>
                            <span className="flex items-center gap-1"><Users size={14}/> {eqs.map(e => e.nom).join(', ')}</span>
                          </div>
                        </div>

                        {isJoueurForEvent && (
                            <div className="p-4">
                              <p className="text-sm font-bold text-gray-700 mb-3 text-center">Serais-tu présent ?</p>
                              <div className="flex gap-3">
                                <button onClick={() => handlePresence(ev.id, 'present')} className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all flex justify-center items-center gap-2 ${monStatut === 'present' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}>✅ Oui</button>
                                <button onClick={() => handlePresence(ev.id, 'absent')} className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all flex justify-center items-center gap-2 ${monStatut === 'absent' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-400'}`}>❌ Non</button>
                              </div>
                            </div>
                        )}

                        {isCoachForEvent && (
                          <div className="bg-indigo-50 p-4 border-t border-indigo-100 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-indigo-800">📊 Suivi du Coach :</span>
                              <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{stats.present} Présents</span>
                              <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{stats.absent} Absents</span>
                            </div>
                            <button onClick={() => handleGenerateFromEvent(ev)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm shadow-sm"><Wand2 size={16} /> Générer l'équipe ({stats.present} joueurs)</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {showEventModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{editingEventId ? "Modifier" : "Créer un événement"}</h2>
                    <form onSubmit={handleSaveEvent} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Équipe(s)</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {mesEquipes.filter(eq => eq.isCoach).map(eq => (
                                <label key={eq.id} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={eventFormData.equipeIds.includes(eq.id)} onChange={(e) => {
                                        const newIds = e.target.checked ? [...eventFormData.equipeIds, eq.id] : eventFormData.equipeIds.filter(id => id !== eq.id);
                                        setEventFormData({...eventFormData, equipeIds: newIds});
                                    }} className="rounded text-indigo-600 w-4 h-4"/>
                                    <span className="text-sm font-medium text-gray-700">{eq.nom}</span>
                                </label>
                            ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                        <select value={eventFormData.type} onChange={e => setEventFormData({...eventFormData, type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 font-medium">
                          <option value="Entraînement">Entraînement</option><option value="Match">Match</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titre</label>
                        <input type="text" value={eventFormData.titre} onChange={e => setEventFormData({...eventFormData, titre: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label><input type="date" value={eventFormData.date} onChange={e => setEventFormData({...eventFormData, date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required /></div>
                        <div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heure</label><input type="time" value={eventFormData.heure} onChange={e => setEventFormData({...eventFormData, heure: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required /></div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-lg">Annuler</button>
                        <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg">Valider</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'generateur' && (
            <div className="animate-fade-in p-4 relative min-h-screen">
              <div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><Wand2 size={24} /></div><div><h1 className="text-2xl font-bold text-gray-800">Générateur</h1><p className="text-sm text-gray-500">Crée des équipes équilibrées</p></div></div>
              {algoStep === 1 && (
                <div className="animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">1. Quelles équipes s'entraînent ?</h2>
                  <div className="space-y-3 mb-6">
                    {mesEquipes.filter(eq => eq.isCoach).map(eq => {
                      const isSelected = selectedTeamsForAlgo.includes(eq.id);
                      return (<div key={eq.id} onClick={() => toggleTeamSelection(eq.id)} className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'}`}><div><p className="text-xs text-gray-400 font-bold uppercase mb-1">{eq.nomStructure}</p><p className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>{eq.nom}</p></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white'}`}>{isSelected && <CheckCircle2 size={16} />}</div></div>)
                    })}
                  </div>
                  {selectedTeamsForAlgo.length > 0 && (<button onClick={() => setAlgoStep(2)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md">Continuer</button>)}
                </div>
              )}
              {algoStep === 2 && (
                <div className="animate-fade-in">
                  <button onClick={() => setAlgoStep(1)} className="text-indigo-600 text-sm font-bold mb-4 flex items-center">← Modifier</button>
                  <h2 className="text-lg font-bold text-gray-800 mb-4">2. Choisis un mode de génération</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleSelectModeAndConfigure('aléatoire')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"><p className="text-2xl mb-2">🎲</p><h3 className="font-bold text-gray-800">Aléatoire</h3></button>
                    <button onClick={() => handleSelectModeAndConfigure('loisir')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"><p className="text-2xl mb-2">🎈</p><h3 className="font-bold text-gray-800">Loisir</h3></button>
                    <button onClick={() => handleSelectModeAndConfigure('entrainement')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"><p className="text-2xl mb-2">💪</p><h3 className="font-bold text-gray-800">Entraînement</h3></button>
                    <button onClick={() => handleSelectModeAndConfigure('match')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"><p className="text-2xl mb-2">🔥</p><h3 className="font-bold text-gray-800">Match 6v6</h3></button>
                  </div>
                </div>
              )}
              {algoStep === 3 && (
                <div className="animate-fade-in">
                  <button onClick={() => setAlgoStep(2)} className="text-indigo-600 text-sm font-bold mb-4 flex items-center">← Retour</button>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex items-center gap-2 mb-4"><Settings className="text-indigo-600" size={20} /><h2 className="text-xl font-bold text-gray-800">Configuration ({algoMode})</h2></div>
                    {algoMode !== 'match' ? (
                      <div className="space-y-4">
                        <div><label className="block text-gray-700 font-bold mb-2">Nombre d'équipes</label><input type="number" min="2" max="10" value={algoConfig.numTeams} onChange={(e) => setAlgoConfig({...algoConfig, numTeams: parseInt(e.target.value) || 2})} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-lg font-bold" /></div>
                        <div><label className="block text-gray-700 font-bold mb-2">Joueurs par terrain</label><select value={algoConfig.playersPerTeam} onChange={(e) => setAlgoConfig({...algoConfig, playersPerTeam: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-lg font-bold"><option value={4}>4</option><option value={5}>5</option><option value={6}>6</option></select></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">Sélection des postes pour le 6v6 :</p>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2 border-t border-b border-gray-100 py-2">
                          {poolOfPlayers.map(p => (
                            <div key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <span className="font-bold text-gray-700 text-sm truncate w-1/2">{p.prenom} {p.nom}</span>
                              <select value={algoConfig.lockedRoles[p.id] || ''} onChange={(e) => {
                                const newLocks = { ...algoConfig.lockedRoles };
                                if (e.target.value === '') delete newLocks[p.id]; else newLocks[p.id] = e.target.value;
                                setAlgoConfig({ ...algoConfig, lockedRoles: newLocks });
                              }} className="w-1/2 border border-indigo-200 rounded px-2 py-1 text-xs bg-white text-indigo-700 font-bold">
                                <option value="">Auto</option><option value="P">Passeur</option><option value="Pt">Pointu</option><option value="R4">Réc-Att</option><option value="C">Central</option><option value="L">Libéro</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setAlgoStep(4)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2"><Wand2 size={20} /> Lancer ({poolOfPlayers.length} joueurs)</button>
                </div>
              )}
              {algoStep === 4 && (<div className="animate-fade-in p-2 sm:p-4 relative"><TeamGenerator mode={algoMode} players={poolOfPlayers} config={algoConfig} goBack={() => setAlgoStep(3)} /></div>)}
            </div>
          )}

          {activeTab === 'profil' && (
            <div className="animate-fade-in p-4 relative min-h-screen">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon Profil</h1>
              {messageProfil && <div className="p-3 rounded-lg text-sm font-medium mb-4 text-center bg-green-100 text-green-700">{messageProfil}</div>}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col items-center mb-6 border-b border-gray-100 pb-6">
                  {photoUrl ? <img src={photoUrl} alt="Profil" className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover mb-4" /> : <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-100 flex items-center justify-center mb-4"><User size={40} className="text-gray-400" /></div>}
                  {isEditingProfile && (<input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700" />)}
                </div>
                {!isEditingProfile ? (
                  <div>
                    <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-gray-800">Mes informations</h2><button onClick={() => setIsEditingProfile(true)} className="text-indigo-600 font-bold text-sm">Modifier</button></div>
                    <div className="space-y-4">
                      <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Nom</p><p className="font-medium text-gray-800 text-lg">{prenom || '-'} {nom || '-'}</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Poste</p><p className="font-medium text-gray-800">{poste || 'Non renseigné'}</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email</p><p className="font-medium text-gray-500">{user.email}</p></div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                     <div className="flex gap-4"><input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Prénom" required /><input type="text" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Nom" required /></div>
                     <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg">Enregistrer</button>
                  </form>
                )}
              </div>
              <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100">Se déconnecter</button>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 pb-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-30">
          <NavButton icon={<Home size={22} />} label="Accueil" isActive={activeTab === 'accueil'} onClick={() => { setActiveTab('accueil'); setCurrentView('main'); }} />
          <NavButton icon={<Calendar size={22} />} label="Agenda" isActive={activeTab === 'calendrier'} onClick={() => setActiveTab('calendrier')} />
          {mesEquipes.some(eq => eq.isCoach) && (<NavButton icon={<Wand2 size={22} />} label="Générateur" isActive={activeTab === 'generateur'} onClick={() => { setActiveTab('generateur'); setAlgoStep(1); }} />)}
          <NavButton icon={<User size={22} />} label="Profil" isActive={activeTab === 'profil'} onClick={() => setActiveTab('profil')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">🏐 Volley Coach</h1>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border border-gray-300 rounded-xl px-4 py-3" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full border border-gray-300 rounded-xl px-4 py-3" required />
          
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all">
            {isLoginMode ? "Se connecter" : "Créer un compte"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-indigo-600 font-bold hover:underline">
            {isLoginMode ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>

        <div className="mt-6 border-t pt-4">
          <button onClick={handleGoogle} className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Se connecter avec Google
          </button>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }) {
  return (<button onClick={onClick} className={`flex flex-col items-center justify-center w-24 pt-2 pb-1 transition-all ${isActive ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}><div className="mb-1">{icon}</div><span className="text-[11px] font-bold">{label}</span></button>);
}

export default App;