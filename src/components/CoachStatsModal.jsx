export default function CoachStatsModal({
  show,
  onClose,
  editingMembre,
  coachStats,
  setCoachStats,
  handleSaveCoachStats,
  statsFields
}) {
  if (!show || !editingMembre) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Noter {editingMembre.prenom}</h2>
        <p className="text-xs text-gray-500 mb-6">Ces statistiques écraseront l'auto-évaluation du joueur pour l'algorithme, mais resteront secrètes.</p>
        
        {/* RAPPEL DES STATS PERSOS DU JOUEUR (Grisé) */}
        {editingMembre.stats && (
          <div className="mb-6 p-4 bg-gray-100 rounded-xl opacity-70 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Auto-évaluation originale</h3>
            <p className="text-sm font-medium mb-2 text-gray-700">Poste : <span className="font-bold">{editingMembre.posteEquipe}</span></p>
            <div className="flex flex-wrap gap-2">
              {statsFields.map(stat => (
                <span key={stat.key} className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-1 rounded capitalize border border-gray-300">
                  {stat.label.split(' ')[0]} : {editingMembre.stats[stat.key] || 5}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CURSEURS COACH (Actifs) */}
        <form onSubmit={handleSaveCoachStats} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Poste imposé par le coach</label>
            <select
              value={coachStats.posteEquipe}
              onChange={e => setCoachStats({ ...coachStats, posteEquipe: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium"
            >
              <option value="Passeur (P)">Passeur (P)</option>
              <option value="Pointu (Pt)">Pointu (Pt)</option>
              <option value="Réceptionneur-Attaquant (R4)">Réceptionneur-Attaquant (R4)</option>
              <option value="Central (C)">Central (C)</option>
              <option value="Libéro (L)">Libéro (L)</option>
              <option value="Polyvalent">Polyvalent</option>
            </select>
          </div>

          <div className="bg-indigo-50 p-5 rounded-xl space-y-5 border border-indigo-100">
            <h3 className="font-bold text-indigo-800 text-sm uppercase tracking-wider mb-2">Notes Coach (1 à 10)</h3>
            {statsFields.map(stat => (
              <div key={stat.key}>
                <div className="flex justify-between text-sm mb-1 font-medium capitalize text-indigo-900">
                  <span>{stat.label}</span>
                  <span className="font-bold bg-indigo-100 px-2 py-0.5 rounded text-indigo-700">{coachStats[stat.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={coachStats[stat.key]}
                  onChange={e => setCoachStats({ ...coachStats, [stat.key]: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-300 rounded-lg accent-indigo-600"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors">
              Annuler
            </button>
            <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}