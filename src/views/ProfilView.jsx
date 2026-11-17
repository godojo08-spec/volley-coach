import { useState } from 'react';
import { User, Trash2, AlertTriangle, X } from 'lucide-react';

export default function ProfilView({
  messageProfil,
  photoUrl,
  isEditingProfile,
  setIsEditingProfile,
  handlePhotoUpload,
  prenom,
  setPrenom,
  nom,
  setNom,
  poste,
  user,
  handleSaveProfile,
  handleLogout,
  handleDeleteAccount
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const onConfirmDelete = async () => {
    if (confirmText !== 'SUPPRIMER') return;
    setIsDeleting(true);
    setDeleteError('');
    const res = await handleDeleteAccount();
    if (!res?.success) {
      setDeleteError(res?.error || 'Impossible de supprimer le compte.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in p-4 relative min-h-screen pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon Profil</h1>

      {messageProfil && (
        <div className="p-3 rounded-lg text-sm font-medium mb-4 text-center bg-green-100 text-green-700">
          {messageProfil}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col items-center mb-6 border-b border-gray-100 pb-6">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profil"
              className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-100 flex items-center justify-center mb-4">
              <User size={40} className="text-gray-400" />
            </div>
          )}
          {isEditingProfile && (
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700"
            />
          )}
        </div>

        {!isEditingProfile ? (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">Mes informations</h2>
              <button onClick={() => setIsEditingProfile(true)} className="text-indigo-600 font-bold text-sm">
                Modifier
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Nom</p>
                <p className="font-medium text-gray-800 text-lg">
                  {prenom || '-'} {nom || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Poste</p>
                <p className="font-medium text-gray-800">{poste || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email</p>
                <p className="font-medium text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Prénom"
                required
              />
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Nom"
                required
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg">
              Enregistrer
            </button>
          </form>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl border border-gray-200 transition-colors"
      >
        Se déconnecter
      </button>

      {/* ZONE DANGEREUSE : SUPPRESSION DU COMPTE */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            setConfirmText('');
            setDeleteError('');
            setShowDeleteModal(true);
          }}
          className="w-full py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={16} /> Supprimer définitivement mon compte
        </button>
      </div>

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-fade-in">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">Supprimer ton compte ?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Cette action est <strong>irréversible</strong>. Ton profil, tes statistiques, tes présences et tes compositions sauvegardées seront définitivement effacés de la base de données.
            </p>

            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Tape <span className="text-red-600 font-mono">SUPPRIMER</span> pour confirmer :
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold mb-4 focus:border-red-500 outline-none"
            />

            {deleteError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={confirmText !== 'SUPPRIMER' || isDeleting}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${
                  confirmText === 'SUPPRIMER' && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 shadow-sm'
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}