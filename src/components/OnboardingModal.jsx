import { CheckCircle2, X } from 'lucide-react';

/**
 * Modale de profil sportif affichée lorsqu'un joueur rejoint une équipe
 * (ou lorsqu'un coach s'ajoute lui-même comme joueur dans l'effectif).
 * Permet de choisir 2 postes et d'auto-évaluer ses 6 statistiques.
 */
export default function OnboardingModal({
  show,
  onClose,
  onboardingStats,
  setOnboardingStats,
  handleSaveOnboarding,
  statsFields,
  pendingJoinEquipe
}) {
  if (!show) return null;

  // Vérifie si l'équipe exige une validation du coach avant d'entrer
  const necessiteValidation = pendingJoinEquipe?.accesControle && !pendingJoinEquipe?.isSelfCoachJoin;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in relative">
        {/* Bouton de fermeture pour annuler l'inscription à l'équipe */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Profil Sportif</h2>
          {pendingJoinEquipe?.nom && (
            <p className="text-xs font-bold text-indigo-600 mt-1">
              Équipe : {pendingJoinEquipe.nom}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Choisis tes postes et évalue ton niveau pour le générateur d'équipes.
          </p>
        </div>

        <form onSubmit={handleSaveOnboarding} className="space-y-6">
          {/* Bloc Sélection des 2 Postes */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1.5">
                Poste principal <span className="text-red-500">*</span>
              </label>
              <select
                value={onboardingStats.poste1}
                onChange={e => setOnboardingStats({ ...onboardingStats, poste1: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium text-sm"
              >
                <option value="Passeur (P)">Passeur (P)</option>
                <option value="Pointu (Pt)">Pointu (Pt)</option>
                <option value="Réceptionneur-Attaquant (R4)">Réceptionneur-Attaquant (R4)</option>
                <option value="Central (C)">Central (C)</option>
                <option value="Libéro (L)">Libéro (L)</option>
                <option value="Polyvalent">Polyvalent</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1.5">
                Poste secondaire <span className="text-xs font-normal text-gray-400">(optionnel)</span>
              </label>
              <select
                value={onboardingStats.poste2}
                onChange={e => setOnboardingStats({ ...onboardingStats, poste2: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium text-sm"
              >
                <option value="Polyvalent">Aucun / Polyvalent</option>
                <option value="Passeur (P)">Passeur (P)</option>
                <option value="Pointu (Pt)">Pointu (Pt)</option>
                <option value="Réceptionneur-Attaquant (R4)">Réceptionneur-Attaquant (R4)</option>
                <option value="Central (C)">Central (C)</option>
                <option value="Libéro (L)">Libéro (L)</option>
              </select>
            </div>
          </div>

          {/* Bloc Curseurs des 6 statistiques */}
          <div className="bg-blue-50 p-5 rounded-xl space-y-5 border border-blue-100">
            {statsFields.map(stat => (
              <div key={stat.key}>
                <div className="flex justify-between text-sm mb-1 font-medium capitalize">
                  <span className="text-blue-900">{stat.label}</span>
                  <span className="text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                    {onboardingStats[stat.key]}/10
                  </span>
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

          {necessiteValidation && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl text-center font-medium">
              🔒 Cette équipe est sur validation : ta demande sera envoyée au coach.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          >
            {necessiteValidation ? 'Envoyer ma demande au coach' : 'Valider et rejoindre'}
          </button>
        </form>
      </div>
    </div>
  );
}