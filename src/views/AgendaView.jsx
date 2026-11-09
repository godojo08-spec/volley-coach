import { Plus, Edit2, Trash2, CalendarDays, Clock, Users, Wand2 } from 'lucide-react';

export default function AgendaView({
  isCoachOfAnyTeam,
  openCreateEventModal,
  evenements,
  mesEquipes,
  presencesGlobales,
  mesPresences,
  openEditEventModal,
  handleDeleteEvent,
  handlePresence,
  handleGenerateFromEvent
}) {
  return (
    <div className="animate-fade-in p-4 relative min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-sm text-gray-500">Gère tes présences</p>
        </div>
        {isCoachOfAnyTeam && (
          <button
            onClick={openCreateEventModal}
            className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {evenements.length === 0 ? (
        <p className="text-gray-500 text-sm mt-10 text-center">Aucun événement prévu.</p>
      ) : (
        <div className="space-y-4">
          {evenements.map(ev => {
            const eqs = mesEquipes.filter(e => (ev.equipeIds || []).includes(e.id));
            if (eqs.length === 0) return null;
            const isCoachForEvent = eqs.some(e => e.isCoach);
            const isJoueurForEvent = eqs.some(e => e.isJoueur);
            const stats = presencesGlobales[ev.id] || { present: 0, absent: 0 };
            const monStatut = mesPresences[ev.id];

            return (
              <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`p-4 border-b ${ev.type === 'Match' ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">{ev.titre}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                          ev.type === 'Match' ? 'bg-orange-200 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ev.type}
                      </span>
                      {isCoachForEvent && (
                        <div className="flex gap-1 ml-1">
                          <button
                            onClick={() => openEditEventModal(ev)}
                            className="p-1.5 bg-white text-gray-500 rounded hover:text-indigo-600 shadow-sm border border-gray-200"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 bg-white text-gray-500 rounded hover:text-red-600 shadow-sm border border-gray-200"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} /> {new Date(ev.date).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {ev.heure}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {eqs.map(e => e.nom).join(', ')}
                    </span>
                  </div>
                </div>

                {isJoueurForEvent && (
                  <div className="p-4">
                    <p className="text-sm font-bold text-gray-700 mb-3 text-center">Serais-tu présent ?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePresence(ev.id, 'present')}
                        className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all flex justify-center items-center gap-2 ${
                          monStatut === 'present'
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        ✅ Oui
                      </button>
                      <button
                        onClick={() => handlePresence(ev.id, 'absent')}
                        className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all flex justify-center items-center gap-2 ${
                          monStatut === 'absent' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        ❌ Non
                      </button>
                    </div>
                  </div>
                )}

                {isCoachForEvent && (
                  <div className="bg-indigo-50 p-4 border-t border-indigo-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-indigo-800">📊 Suivi du Coach :</span>
                      <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{stats.present} Présents</span>
                      <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{stats.absent} Absents</span>
                    </div>
                    <button
                      onClick={() => handleGenerateFromEvent(ev)}
                      className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm shadow-sm"
                    >
                      <Wand2 size={16} /> Générer l'équipe ({stats.present} joueurs)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}