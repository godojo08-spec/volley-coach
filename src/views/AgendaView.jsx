import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CalendarDays,
  Clock,
  Users,
  Wand2,
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';

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
  handleGenerateFromEvent,
  confirmationPresence,
  evenements7Jours
}) {
  const [expandedEventId, setExpandedEventId] = useState(null);

  const getJoursRestants = dateStr => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    if (diff > 1 && diff <= 7) return `Dans ${diff} jours`;
    return null;
  };

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

      {/* BANDEAU DE NOTIFICATION : ÉVÉNEMENTS SOUS 7 JOURS */}
      {evenements7Jours && evenements7Jours.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
            <Bell size={16} className="text-amber-600" />
            <span>Événements dans les 7 prochains jours ({evenements7Jours.length})</span>
          </div>
          <div className="space-y-1.5">
            {evenements7Jours.map(ev => {
              const delai = getJoursRestants(ev.date);
              const statut = mesPresences[ev.id];
              const estJoueur = mesEquipes.some(e => (ev.equipeIds || []).includes(e.id) && e.isJoueur);
              return (
                <div
                  key={ev.id}
                  className="flex justify-between items-center bg-white/80 px-3 py-2 rounded-lg text-xs border border-amber-100"
                >
                  <div>
                    <span className="font-bold text-gray-800">{ev.titre}</span>
                    <span className="text-gray-500 ml-2">
                      ({delai} à {ev.heure})
                    </span>
                  </div>
                  {estJoueur && (
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        statut === 'present'
                          ? 'bg-green-100 text-green-700'
                          : statut === 'absent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {statut === 'present' ? 'Confirmé ✅' : statut === 'absent' ? 'Absent ❌' : 'À confirmer'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {evenements.length === 0 ? (
        <p className="text-gray-500 text-sm mt-10 text-center">Aucun événement prévu.</p>
      ) : (
        <div className="space-y-4">
          {evenements.map(ev => {
            const eqs = mesEquipes.filter(e => (ev.equipeIds || []).includes(e.id));
            if (eqs.length === 0) return null;
            const isCoachForEvent = eqs.some(e => e.isCoach);
            const isJoueurForEvent = eqs.some(e => e.isJoueur);
            const stats = presencesGlobales[ev.id] || {
              present: 0,
              absent: 0,
              enAttente: 0,
              listePresents: [],
              listeAbsents: [],
              listeEnAttente: []
            };
            const monStatut = mesPresences[ev.id];
            const delaiProche = getJoursRestants(ev.date);
            const isExpanded = expandedEventId === ev.id;

            return (
              <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`p-4 border-b ${ev.type === 'Match' ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-800 text-lg">{ev.titre}</h3>
                      {delaiProche && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                          ⏰ {delaiProche}
                        </span>
                      )}
                    </div>
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
                    <p className="text-sm font-bold text-gray-700 mb-3 text-center">Seras-tu présent ?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePresence(ev.id, 'present')}
                        className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all flex justify-center items-center gap-2 ${
                          monStatut === 'present'
                            ? 'bg-green-100 border-green-500 text-green-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        ✅ Oui
                      </button>
                      <button
                        onClick={() => handlePresence(ev.id, 'absent')}
                        className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all flex justify-center items-center gap-2 ${
                          monStatut === 'absent'
                            ? 'bg-red-100 border-red-500 text-red-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        ❌ Non
                      </button>
                    </div>

                    {/* MESSAGE DE CONFIRMATION VISUELLE */}
                    {confirmationPresence?.eventId === ev.id && (
                      <div
                        className={`mt-3 p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 animate-fade-in ${
                          confirmationPresence.statut === 'present'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <CheckCircle2 size={15} />
                        <span>
                          {confirmationPresence.statut === 'present'
                            ? 'Ta présence est bien prise en compte !'
                            : 'Ton absence est bien enregistrée.'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isCoachForEvent && (
                  <div className="bg-indigo-50 p-4 border-t border-indigo-100 flex flex-col gap-3">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-bold">
                      <span className="text-indigo-800">📊 Suivi :</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          {stats.present} Présents
                        </span>
                        <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          {stats.absent} Absents
                        </span>
                        <span className="text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
                          {stats.enAttente || 0} En attente
                        </span>
                      </div>
                    </div>

                    {/* BOUTON POUR DÉPLIER LA LISTE DES JOUEURS */}
                    <button
                      type="button"
                      onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                      className="w-full bg-white text-indigo-700 border border-indigo-200 font-bold py-2 px-3 rounded-lg hover:bg-indigo-100/50 flex items-center justify-between text-xs transition-colors"
                    >
                      <span>{isExpanded ? 'Masquer le détail des joueurs' : 'Voir le détail des réponses'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* DÉTAIL DES RÉPONSES PAR STATUT */}
                    {isExpanded && (
                      <div className="bg-white rounded-lg p-3 border border-indigo-100 space-y-3 text-xs animate-fade-in">
                        <div>
                          <p className="font-bold text-green-700 mb-1">✅ Présents ({stats.listePresents?.length || 0})</p>
                          {stats.listePresents?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {stats.listePresents.map(j => (
                                <span
                                  key={j.id}
                                  className="bg-green-50 text-green-800 border border-green-200 px-2 py-0.5 rounded font-medium"
                                >
                                  {j.prenom} {j.nom}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">Aucun présent pour le moment</p>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-red-600 mb-1">❌ Absents ({stats.listeAbsents?.length || 0})</p>
                          {stats.listeAbsents?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {stats.listeAbsents.map(j => (
                                <span
                                  key={j.id}
                                  className="bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded font-medium"
                                >
                                  {j.prenom} {j.nom}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">Aucun absent</p>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-gray-600 mb-1">
                            ⏳ En attente ({stats.listeEnAttente?.length || 0})
                          </p>
                          {stats.listeEnAttente?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {stats.listeEnAttente.map(j => (
                                <span
                                  key={j.id}
                                  className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded font-medium"
                                >
                                  {j.prenom} {j.nom}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">Tout le monde a répondu</p>
                          )}
                        </div>
                      </div>
                    )}

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