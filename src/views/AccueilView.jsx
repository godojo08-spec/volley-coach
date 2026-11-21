import { useState } from 'react';
import { UserPlus, ChevronRight, Plus, MoreVertical, LogOut, X, Link2, Check, Lock, Unlock } from 'lucide-react';

export default function AccueilView({
  currentView,
  setCurrentView,
  prenom,
  codeInvitation,
  setCodeInvitation,
  handleJoinEquipe,
  messageRejoindre,
  mesStructures,
  handleOpenStructure,
  mesEquipes,
  handleOpenEquipe,
  selectedStructure,
  equipesStructure,
  selectedEquipe,
  openMenuId,
  setOpenMenuId,
  membresEquipe,
  user,
  handleOpenCoachStats,
  handlePromote,
  handleRemove,
  setCreateType,
  setSelectedStructureIdForNewTeam,
  setShowCreateModal,
  setOnboardingStats,
  setShowOnboardingModal,
  handleBan,
  handleUnban,
  bannisEquipe,
  handleLeaveEquipe,
  handleRenameEquipe,
  handleClearEquipePlayers,
  handleDeleteEquipe,
  demandesEquipe,
  handleToggleEquipeAccess,
  handleAcceptDemande,
  handleRejectDemande,
  setPendingJoinEquipe
}) {
  const [renamingEquipe, setRenamingEquipe] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const monLienDansEquipe = membresEquipe.find(m => m.id === user.uid);

  /**
   * Génère et copie dans le presse-papier le lien direct d'invitation à l'équipe.
   */
  const handleCopyInviteLink = () => {
    if (!selectedEquipe) return;
    const inviteUrl = `${window.location.origin}/?join=${selectedEquipe.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const submitRename = async e => {
    e.preventDefault();
    if (!renamingEquipe || !newTeamName.trim()) return;
    await handleRenameEquipe(renamingEquipe.id, newTeamName);
    setRenamingEquipe(null);
    setNewTeamName('');
  };

  return (
    <div className="animate-fade-in p-4 relative min-h-screen">
      {currentView === 'main' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Mes Groupes</h1>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
              {prenom ? prenom.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <UserPlus size={16} /> Rejoindre une équipe
            </h2>
            <form onSubmit={handleJoinEquipe} className="flex gap-2">
              <input
                type="text"
                value={codeInvitation}
                onChange={e => setCodeInvitation(e.target.value)}
                placeholder="Code d'invitation..."
                className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
              <button type="submit" className="bg-gray-800 text-white font-bold px-4 rounded-lg text-sm">
                Rejoindre
              </button>
            </form>
          </div>
          {messageRejoindre && (
            <p className="text-xs font-bold text-center mb-4 text-indigo-700 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
              {messageRejoindre}
            </p>
          )}
          {mesStructures.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Structures (Espace Coach)</h2>
              <div className="space-y-3">
                {mesStructures.map(struct => (
                  <div
                    key={struct.id}
                    onClick={() => handleOpenStructure(struct)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-xl shadow-md text-white flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-xl">{struct.nom}</p>
                    </div>
                    <ChevronRight className="text-blue-200" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {mesEquipes.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Mes Équipes</h2>
              <div className="space-y-3">
                {mesEquipes.map(eq => (
                  <div
                    key={eq.id}
                    onClick={() => handleOpenEquipe(eq)}
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{eq.nomStructure}</p>
                      <p className="font-bold text-gray-800">{eq.nom}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {eq.isCoach && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                          Coach
                        </span>
                      )}
                      {eq.isJoueur && (
                        <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-100">
                          Joueur
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {currentView === 'detail_structure' && selectedStructure && (
        <div className="animate-fade-in relative">
          {openMenuId && <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)}></div>}
          <button
            onClick={() => {
              setOpenMenuId(null);
              setCurrentView('main');
            }}
            className="text-blue-600 text-sm font-bold mb-4 flex items-center"
          >
            ← Retour
          </button>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl shadow-md text-white mb-6">
            <h2 className="text-3xl font-bold">{selectedStructure.nom}</h2>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Équipes</h3>
          </div>
          <div className="space-y-3">
            {equipesStructure.map(eq => {
              const canManageTeam = selectedStructure.isCoach || mesEquipes.find(e => e.id === eq.id)?.isCoach;
              return (
                <div
                  key={eq.id}
                  onClick={() => handleOpenEquipe(eq)}
                  className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer relative ${
                    openMenuId === eq.id ? 'z-40' : 'z-10'
                  }`}
                >
                  <p className="font-bold text-gray-800 text-lg">{eq.nom}</p>
                  <div className="flex items-center gap-1">
                    {canManageTeam && (
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === eq.id ? null : eq.id)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical size={20} />
                        </button>
                        {openMenuId === eq.id && (
                          <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setRenamingEquipe(eq);
                                setNewTeamName(eq.nom);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50"
                            >
                              ✏️ Renommer l'équipe
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearEquipePlayers(eq)}
                              className="w-full text-left px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 border-b border-gray-100"
                            >
                              🧹 Supprimer tous les joueurs
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEquipe(eq)}
                              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold"
                            >
                              🗑️ Supprimer l'équipe
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <ChevronRight className="text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
          {equipesStructure.length === 0 && (
            <p className="text-sm text-gray-500 italic mt-4 bg-white p-4 rounded-xl text-center">
              Aucune équipe dans cette structure.<br />
              Utilise le bouton bleu en bas à droite pour en créer une.
            </p>
          )}
        </div>
      )}

      {currentView === 'detail_equipe' && selectedEquipe && (
        <div className="animate-fade-in relative">
          {openMenuId && <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)}></div>}
          <button
            onClick={() => {
              setOpenMenuId(null);
              setCurrentView('main');
            }}
            className="text-blue-600 text-sm font-bold mb-4"
          >
            ← Retour
          </button>

          {/* EN-TÊTE DE L'ÉQUIPE + PARTAGE DE LIEN & MODE D'ACCÈS */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 border-l-4 border-l-blue-500">
            <h2 className="text-2xl font-bold text-gray-800">{selectedEquipe.nom}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Code d'invitation :{' '}
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded select-all font-bold">{selectedEquipe.id}</span>
            </p>

            {/* Zone de partage du lien + choix "À tous / Demande d'accès" pour le coach */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
              >
                {linkCopied ? (
                  <>
                    <Check size={14} className="text-green-600" />
                    <span className="text-green-700">Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Link2 size={14} />
                    <span>Partager le lien</span>
                  </>
                )}
              </button>

              {monLienDansEquipe?.isCoach ? (
                <button
                  type="button"
                  onClick={handleToggleEquipeAccess}
                  title="Clique pour changer le mode d'entrée dans l'équipe"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors ${
                    selectedEquipe.accesControle
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  }`}
                >
                  {selectedEquipe.accesControle ? (
                    <>
                      <Lock size={13} />
                      <span>Sur demande d'accès</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={13} />
                      <span>Ouvert à tous</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium">
                  {selectedEquipe.accesControle ? '🔒 Sur validation du coach' : '🔓 Entrée libre'}
                </span>
              )}
            </div>
          </div>

          {/* BLOC DEMANDES D'ADHÉSION EN ATTENTE (VISIBLE UNIQUEMENT PAR LE COACH) */}
          {monLienDansEquipe?.isCoach && demandesEquipe?.length > 0 && (
            <div className="mb-8 bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
              <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                ⏳ Demandes d'accès en attente ({demandesEquipe.length})
              </h3>
              <div className="space-y-2.5">
                {demandesEquipe.map(demande => (
                  <div
                    key={demande.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {demande.prenom} {demande.nom}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Poste 1 : <span className="font-medium text-gray-700">{demande.poste1}</span>
                        {demande.poste2 && demande.poste2 !== 'Polyvalent' && (
                          <>
                            {' '}
                            • Poste 2 : <span className="font-medium text-gray-700">{demande.poste2}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptDemande(demande)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors"
                      >
                        ✅ Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectDemande(demande.id)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs transition-colors"
                      >
                        ❌ Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">Staff & Coachs</h3>
          <div className="space-y-3 mb-8">
            {membresEquipe
              .filter(m => m.isCoach)
              .map(membre => (
                <div key={membre.id} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <p className="font-bold text-indigo-900">
                    {membre.prenom} {membre.nom}
                  </p>
                </div>
              ))}
          </div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-lg">Effectif</h3>
            {monLienDansEquipe?.isCoach && !monLienDansEquipe?.isJoueur && (
              <button
                onClick={() => {
                  setPendingJoinEquipe({
                    id: selectedEquipe.id,
                    nom: selectedEquipe.nom,
                    accesControle: false,
                    isSelfCoachJoin: true,
                    membreDocId: monLienDansEquipe.membreDocId
                  });
                  setOnboardingStats({
                    poste1: monLienDansEquipe.posteEquipe || 'Polyvalent',
                    poste2: 'Polyvalent',
                    attaque: 5,
                    reception: 5,
                    passe: 5,
                    bloc: 5,
                    defense: 5,
                    service: 5
                  });
                  setShowOnboardingModal(true);
                }}
                className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200"
              >
                + Je joue aussi
              </button>
            )}
          </div>

          <div className="space-y-3 mb-10">
            {membresEquipe
              .filter(m => m.isJoueur)
              .map(membre => (
                <div
                  key={membre.id}
                  className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center relative ${
                    openMenuId === membre.id ? 'z-40' : 'z-10'
                  }`}
                >
                  <div>
                    <p className="font-bold text-gray-800">
                      {membre.prenom} {membre.nom}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">{membre.coachPoste || membre.posteEquipe}</p>
                      {monLienDansEquipe?.isCoach && membre.coachStats && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                          Noté coach
                        </span>
                      )}
                    </div>
                  </div>
                  {monLienDansEquipe?.isCoach && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === membre.id ? null : membre.id)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {openMenuId === membre.id && (
                        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                          <button
                            onClick={() => handleOpenCoachStats(membre)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50"
                          >
                            📊 Éditer les stats
                          </button>
                          <button
                            onClick={() => handlePromote(membre, 'Coach')}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50"
                          >
                            👑 Coach uniquement
                          </button>
                          {!membre.isCoach && (
                            <button
                              onClick={() => handlePromote(membre, 'Coach + Joueur')}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100"
                            >
                              👑 Coach + Joueur
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(membre)}
                            className="w-full text-left px-4 py-3 text-sm text-red-600"
                          >
                            ❌ Retirer
                          </button>
                          <button
                            onClick={() => handleBan(membre, 7)}
                            className="w-full text-left px-4 py-3 text-sm text-white bg-red-600 hover:bg-red-700 font-bold"
                          >
                            ⛔ Bannir (7 jours)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {monLienDansEquipe?.isCoach && bannisEquipe?.length > 0 && (
            <div className="mt-8 mb-10 bg-red-50 p-4 rounded-xl border border-red-200">
              <h3 className="font-bold text-red-800 text-sm uppercase tracking-wider mb-3">
                Membres suspendus ({bannisEquipe.length})
              </h3>
              <div className="space-y-2">
                {bannisEquipe.map(ban => (
                  <div
                    key={ban.id}
                    className="bg-white p-3 rounded-lg border border-red-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {ban.prenom} {ban.nom}{' '}
                        {ban.email && <span className="text-xs font-normal text-gray-500">({ban.email})</span>}
                      </p>
                      <p className="text-[11px] text-red-600">
                        Jusqu'au {new Date(ban.dateFin).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnban(ban.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg"
                    >
                      Débannir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOUTON QUITTER L'ÉQUIPE (JOUEUR) */}
          {monLienDansEquipe?.isJoueur && (
            <div className="mt-8 pt-6 border-t border-gray-200 mb-6">
              <button
                type="button"
                onClick={handleLeaveEquipe}
                className="w-full py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Quitter l'équipe
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODALE DE RENOMMAGE D'ÉQUIPE (STRUCTURE) */}
      {renamingEquipe && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-fade-in">
            <button
              type="button"
              onClick={() => setRenamingEquipe(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Renommer l'équipe</h3>
            <form onSubmit={submitRename} className="space-y-4">
              <input
                type="text"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="Nouveau nom de l'équipe..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-blue-500 outline-none"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingEquipe(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOUTON + FLOTTANT GLOBAL */}
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
  );
}