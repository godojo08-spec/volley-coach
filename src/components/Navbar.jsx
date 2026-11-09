import { Home, Calendar, Wand2, User } from 'lucide-react';

function NavButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-24 pt-2 pb-1 transition-all ${
        isActive ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-[11px] font-bold">{label}</span>
    </button>
  );
}

export default function Navbar({ activeTab, setActiveTab, setCurrentView, setAlgoStep, isCoachOfAnyTeam }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 pb-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-30">
      <NavButton
        icon={<Home size={22} />}
        label="Accueil"
        isActive={activeTab === 'accueil'}
        onClick={() => {
          setActiveTab('accueil');
          setCurrentView('main');
        }}
      />
      <NavButton
        icon={<Calendar size={22} />}
        label="Agenda"
        isActive={activeTab === 'calendrier'}
        onClick={() => setActiveTab('calendrier')}
      />
      {isCoachOfAnyTeam && (
        <NavButton
          icon={<Wand2 size={22} />}
          label="Générateur"
          isActive={activeTab === 'generateur'}
          onClick={() => {
            setActiveTab('generateur');
            setAlgoStep(1);
          }}
        />
      )}
      <NavButton
        icon={<User size={22} />}
        label="Profil"
        isActive={activeTab === 'profil'}
        onClick={() => setActiveTab('profil')}
      />
    </div>
  );
}