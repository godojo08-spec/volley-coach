import { User } from 'lucide-react';

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
  handleLogout
}) {
  return (
    <div className="animate-fade-in p-4 relative min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon Profil</h1>
      {messageProfil && <div className="p-3 rounded-lg text-sm font-medium mb-4 text-center bg-green-100 text-green-700">{messageProfil}</div>}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col items-center mb-6 border-b border-gray-100 pb-6">
          {photoUrl ? (
            <img src={photoUrl} alt="Profil" className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover mb-4" />
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
      <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100">
        Se déconnecter
      </button>
    </div>
  );
}