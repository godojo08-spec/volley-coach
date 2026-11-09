import { UserPlus, ChevronRight, Plus, MoreVertical } from 'lucide-react';

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
  setShowCreateModal
}) {
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
          {messageRejoindre && <p className="text-xs font-bold text-center mb-4 text-indigo-600">{messageRejoindre}</p>}
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
        <div className="animate-fade-in">
          <button onClick={() => setCurrentView('main')} className="text-blue-600 text-sm font-bold mb-4 flex items-center">
            ← Retour
          </button>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl shadow-md text-white mb-6">
            <h2 className="text-3xl font-bold">{selectedStructure.nom}</h2>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Équipes</h3>
          </div>
          <div className="space-y-3">
            {equipesStructure.map(eq => (
              <div
                key={eq.id}
                onClick={() => handleOpenEquipe(eq)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer"
              >
                <p className="font-bold text-gray-800 text-lg">{eq.nom}</p>
                <ChevronRight className="text-gray-400" />
              </div>
            ))}
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
          {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>}
          <button onClick={() => setCurrentView('main')} className="text-blue-600 text-sm font-bold mb-4">
            ← Retour
          </button>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 border-l-4 border-l-blue-500">
            <h2 className="text-2xl font-bold text-gray-800">{selectedEquipe.nom}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Code d'invitation :{' '}
              <span className="font-mono bg-gray-100 px-1 py-0.5 rounded select-all font-bold">{selectedEquipe.id}</span>
            </p>
          </div>
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
          <h3 className="font-bold text-gray-800 text-lg mb-3">Effectif</h3>
          <div className="space-y-3 mb-10">
            {membresEquipe
              .filter(m => m.isJoueur)
              .map(membre => (
                <div
                  key={membre.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center relative"
                >
                  <div>
                    <p className="font-bold text-gray-800">
                      {membre.prenom} {membre.nom}
                    </p>
                    <p className="text-xs text-gray-500">{membre.coachPoste || membre.posteEquipe}</p>
                  </div>
                  {membresEquipe.find(m => m.id === user.uid)?.isCoach && (
                    <div className="relative z-20">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === membre.id ? null : membre.id)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {openMenuId === membre.id && (
                        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden py-1">
                          <button
                            onClick={() => handleOpenCoachStats(membre)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50"
                          >
                            📊 Éditer les stats
                          </button>
                          <button
                            onClick={() => handlePromote(membre, 'Coach + Joueur')}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50"
                          >
                            👑 Promouvoir
                          </button>
                          <button
                            onClick={() => handleRemove(membre)}
                            className="w-full text-left px-4 py-3 text-sm text-red-600"
                          >
                            ❌ Retirer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
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