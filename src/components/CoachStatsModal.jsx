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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Stats de {editingMembre.prenom}</h2>
        <p className="text-xs text-gray-500 mb-4">Ces notes sont secrètes et prioritaires pour le générateur.</p>
        <form onSubmit={handleSaveCoachStats} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Poste assigné (Coach)</label>
            <select
              value={coachStats.posteEquipe}
              onChange={e => setCoachStats({ ...coachStats, posteEquipe: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-medium"
            >
              <option value="Passeur (P)">Passeur (P)</option>
              <option value="Pointu (Pt)">Pointu (Pt)</option>
              <option value="Réceptionneur-Attaquant (R4)">Réceptionneur-Attaquant (R4)</option>
              <option value="Central (C)">Central (C)</option>
              <option value="Libéro (L)">Libéro (L)</option>
              <option value="Polyvalent">Polyvalent</option>
            </select>
          </div>

          <div className="space-y-3 mt-4 border-t pt-4 border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Évaluation du Coach (1 à 10)</p>
            {statsFields.map(stat => (
              <div key={stat.key} className="flex items-center gap-3">
                <label className="w-24 text-sm font-medium text-gray-700">{stat.label}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={coachStats[stat.key]}
                  onChange={e => setCoachStats({ ...coachStats, [stat.key]: parseInt(e.target.value) })}
                  className="flex-grow accent-indigo-600"
                />
                <span className="w-6 text-sm font-bold text-indigo-700 text-right">{coachStats[stat.key]}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-lg">
              Annuler
            </button>
            <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}