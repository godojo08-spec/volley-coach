import { CheckCircle2 } from 'lucide-react';

export default function OnboardingModal({
  show,
  onboardingStats,
  setOnboardingStats,
  handleSaveOnboarding,
  statsFields
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Profil Sportif</h2>
          <p className="text-xs text-gray-500 mt-1">Évalue ton niveau pour le générateur d'équipes.</p>
        </div>

        <form onSubmit={handleSaveOnboarding} className="space-y-6">
          {/* Bloc Poste */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Poste principal</label>
              <select
                value={onboardingStats.poste1}
                onChange={e => setOnboardingStats({ ...onboardingStats, poste1: e.target.value })}
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
          </div>

          {/* Bloc Curseurs */}
          <div className="bg-blue-50 p-5 rounded-xl space-y-5 border border-blue-100">
            {statsFields.map(stat => (
              <div key={stat.key}>
                <div className="flex justify-between text-sm mb-1 font-medium capitalize">
                  <span className="text-blue-900">{stat.label}</span>
                  <span className="text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">{onboardingStats[stat.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={onboardingStats[stat.key]}
                  onChange={e => setOnboardingStats({ ...onboardingStats, [stat.key]: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-300 rounded-lg accent-blue-600"
                />
              </div>
            ))}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors">
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}