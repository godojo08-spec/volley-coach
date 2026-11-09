export default function OnboardingModal({
  show,
  onboardingStats,
  setOnboardingStats,
  handleSaveOnboarding,
  statsFields
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ton profil Joueur</h2>
        <p className="text-xs text-gray-500 mb-4">Évalue ton niveau pour aider le générateur d'équipes.</p>
        <form onSubmit={handleSaveOnboarding} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Poste principal</label>
            <select
              value={onboardingStats.poste1}
              onChange={e => setOnboardingStats({ ...onboardingStats, poste1: e.target.value })}
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tes statistiques (1 à 10)</p>
            {statsFields.map(stat => (
              <div key={stat.key} className="flex items-center gap-3">
                <label className="w-24 text-sm font-medium text-gray-700">{stat.label}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={onboardingStats[stat.key]}
                  onChange={e => setOnboardingStats({ ...onboardingStats, [stat.key]: parseInt(e.target.value) })}
                  className="flex-grow accent-indigo-600"
                />
                <span className="w-6 text-sm font-bold text-indigo-700 text-right">{onboardingStats[stat.key]}</span>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700 mt-4">
            Rejoindre l'équipe
          </button>
        </form>
      </div>
    </div>
  );
}