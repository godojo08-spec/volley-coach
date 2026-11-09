export default function EventModal({
  show,
  onClose,
  editingEventId,
  eventFormData,
  setEventFormData,
  mesEquipes,
  handleSaveEvent
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{editingEventId ? 'Modifier' : 'Créer un événement'}</h2>
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Équipe(s)</label>
            <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-lg border border-gray-200">
              {mesEquipes
                .filter(eq => eq.isCoach)
                .map(eq => (
                  <label key={eq.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventFormData.equipeIds.includes(eq.id)}
                      onChange={e => {
                        const newIds = e.target.checked
                          ? [...eventFormData.equipeIds, eq.id]
                          : eventFormData.equipeIds.filter(id => id !== eq.id);
                        setEventFormData({ ...eventFormData, equipeIds: newIds });
                      }}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">{eq.nom}</span>
                  </label>
                ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
            <select
              value={eventFormData.type}
              onChange={e => setEventFormData({ ...eventFormData, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-medium"
            >
              <option value="Entraînement">Entraînement</option>
              <option value="Match">Match</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titre</label>
            <input
              type="text"
              value={eventFormData.titre}
              onChange={e => setEventFormData({ ...eventFormData, titre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
              <input
                type="date"
                value={eventFormData.date}
                onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heure</label>
              <input
                type="time"
                value={eventFormData.heure}
                onChange={e => setEventFormData({ ...eventFormData, heure: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-lg">
              Annuler
            </button>
            <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg">
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}