export default function CreateGroupModal({
  show,
  onClose,
  createType,
  setCreateType,
  mesStructures,
  nomStructure,
  setNomStructure,
  handleCreateStructure,
  selectedStructureIdForNewTeam,
  setSelectedStructureIdForNewTeam,
  nomNouvelleEquipe,
  setNomNouvelleEquipe,
  handleCreateEquipe,
  messageCreation
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Créer un groupe</h2>

        {mesStructures.length > 0 && (
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setCreateType('structure')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                createType === 'structure' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Structure
            </button>
            <button
              type="button"
              onClick={() => setCreateType('equipe')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                createType === 'equipe' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Équipe
            </button>
          </div>
        )}

        {messageCreation && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm font-bold rounded-lg text-center">
            {messageCreation}
          </div>
        )}

        {createType === 'structure' ? (
          <form onSubmit={handleCreateStructure} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom de la structure</label>
              <input
                type="text"
                value={nomStructure}
                onChange={e => setNomStructure(e.target.value)}
                placeholder="Ex: Volley Club Paris"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700">
              Créer la structure
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateEquipe} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Structure parente</label>
              <select
                value={selectedStructureIdForNewTeam}
                onChange={e => setSelectedStructureIdForNewTeam(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-medium"
                required
              >
                {mesStructures.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom de l'équipe</label>
              <input
                type="text"
                value={nomNouvelleEquipe}
                onChange={e => setNomNouvelleEquipe(e.target.value)}
                placeholder="Ex: M18 Masc"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700">
              Créer l'équipe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}