import { Wand2, CheckCircle2, Settings } from 'lucide-react';
import TeamGenerator from '../TeamGenerator';

export default function GenerateurView({
  algoStep,
  setAlgoStep,
  mesEquipes,
  selectedTeamsForAlgo,
  toggleTeamSelection,
  handleGoToStep2,
  handleSelectModeAndConfigure,
  algoMode,
  algoConfig,
  setAlgoConfig,
  poolOfPlayers
}) {
  return (
    <div className="animate-fade-in p-4 relative min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
          <Wand2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Générateur</h1>
          <p className="text-sm text-gray-500">Crée des équipes équilibrées</p>
        </div>
      </div>

      {algoStep === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-bold text-gray-800 mb-4">1. Quelles équipes s'entraînent ?</h2>
          <div className="space-y-3 mb-6">
            {mesEquipes
              .filter(eq => eq.isCoach)
              .map(eq => {
                const isSelected = selectedTeamsForAlgo.includes(eq.id);
                return (
                  <div
                    key={eq.id}
                    onClick={() => toggleTeamSelection(eq.id)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer ${
                      isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">{eq.nomStructure}</p>
                      <p className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>{eq.nom}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 size={16} />}
                    </div>
                  </div>
                );
              })}
          </div>
          {selectedTeamsForAlgo.length > 0 && (
            <button onClick={handleGoToStep2} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md">
              Continuer
            </button>
          )}
        </div>
      )}

      {algoStep === 2 && (
        <div className="animate-fade-in">
          <button onClick={() => setAlgoStep(1)} className="text-indigo-600 text-sm font-bold mb-4 flex items-center">
            ← Modifier l'effectif
          </button>
          <h2 className="text-lg font-bold text-gray-800 mb-4">2. Choisis un mode de génération</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectModeAndConfigure('aléatoire')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"
            >
              <p className="text-2xl mb-2">🎲</p>
              <h3 className="font-bold text-gray-800">Aléatoire</h3>
            </button>
            <button
              onClick={() => handleSelectModeAndConfigure('loisir')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"
            >
              <p className="text-2xl mb-2">🎈</p>
              <h3 className="font-bold text-gray-800">Loisir</h3>
            </button>
            <button
              onClick={() => handleSelectModeAndConfigure('entrainement')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"
            >
              <p className="text-2xl mb-2">💪</p>
              <h3 className="font-bold text-gray-800">Entraînement</h3>
            </button>
            <button
              onClick={() => handleSelectModeAndConfigure('match')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-left"
            >
              <p className="text-2xl mb-2">🔥</p>
              <h3 className="font-bold text-gray-800">Match 6v6</h3>
            </button>
          </div>
        </div>
      )}

      {algoStep === 3 && (
        <div className="animate-fade-in">
          <button onClick={() => setAlgoStep(2)} className="text-indigo-600 text-sm font-bold mb-4 flex items-center">
            ← Retour
          </button>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="text-indigo-600" size={20} />
              <h2 className="text-xl font-bold text-gray-800">Configuration ({algoMode})</h2>
            </div>
            {algoMode !== 'match' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Nombre d'équipes</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={algoConfig.numTeams}
                    onChange={e => setAlgoConfig({ ...algoConfig, numTeams: parseInt(e.target.value) || 2 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Joueurs par terrain</label>
                  <select
                    value={algoConfig.playersPerTeam}
                    onChange={e => setAlgoConfig({ ...algoConfig, playersPerTeam: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-lg font-bold"
                  >
                    <option value={4}>4 (Losange)</option>
                    <option value={5}>5 (Pentagone)</option>
                    <option value={6}>6 (Classique)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">Sélection des postes pour le 6v6 (Mode Match) :</p>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-2 border-t border-b border-gray-100 py-2">
                  {poolOfPlayers.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <span className="font-bold text-gray-700 text-sm truncate w-1/2">
                        {p.prenom} {p.nom}
                      </span>
                      <select
                        value={algoConfig.lockedRoles[p.id] || ''}
                        onChange={e => {
                          const newLocks = { ...algoConfig.lockedRoles };
                          if (e.target.value === '') delete newLocks[p.id];
                          else newLocks[p.id] = e.target.value;
                          setAlgoConfig({ ...algoConfig, lockedRoles: newLocks });
                        }}
                        className="w-1/2 border border-indigo-200 rounded px-2 py-1 text-xs bg-white text-indigo-700 font-bold"
                      >
                        <option value="">Auto</option>
                        <option value="P">Passeur</option>
                        <option value="Pt">Pointu</option>
                        <option value="R4">Réc-Att</option>
                        <option value="C">Central</option>
                        <option value="L">Libéro</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setAlgoStep(4)}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Wand2 size={20} /> Lancer ({poolOfPlayers.length} joueurs)
          </button>
        </div>
      )}

      {algoStep === 4 && (
        <div className="animate-fade-in p-2 sm:p-4 relative">
          <TeamGenerator mode={algoMode} players={poolOfPlayers} config={algoConfig} goBack={() => setAlgoStep(3)} />
        </div>
      )}
    </div>
  );
}