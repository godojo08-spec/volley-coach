import React, { useState, useEffect } from 'react';
import { Info, ArrowLeftRight, X, Activity, Wand2, User } from 'lucide-react'; // AJOUT DE L'ICONE USER

export default function TeamGenerator({ mode, players, config, goBack }) {
  const [teams, setTeams] = useState([]);
  const [bench, setBench] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null); 
  const [swapMode, setSwapMode] = useState(false); 
  const [isGenerating, setIsGenerating] = useState(true);

  // ========================================================
  // 1. LE CERVEAU MATHÉMATIQUE
  // ========================================================
  useEffect(() => {
    generateTeams();
  }, [mode, players, config]);

  const generateTeams = () => {
    setIsGenerating(true);
    let generatedTeams = [];
    let leftover = [];
    
    const getAvg = (p) => Object.values(p.stats).reduce((a, b) => a + b, 0) / 6;
    
    const getShortRole = (longRole) => {
        if (!longRole) return 'Polyvalent';
        if (longRole.includes('Passeur')) return 'P';
        if (longRole.includes('Pointu')) return 'Pt';
        if (longRole.includes('R4')) return 'R4';
        if (longRole.includes('Central')) return 'C';
        if (longRole.includes('Libéro')) return 'L';
        return 'Polyvalent';
    };

    if (mode === 'aléatoire') {
      let shuffled = [...players].sort(() => Math.random() - 0.5);
      generatedTeams = Array.from({ length: config.numTeams }, () => []);
      shuffled.forEach((p) => {
        const smallestTeamIndex = generatedTeams.findIndex(t => t.length < config.playersPerTeam);
        if (smallestTeamIndex !== -1) generatedTeams[smallestTeamIndex].push(p);
        else leftover.push(p);
      });

    } else if (mode === 'loisir' || mode === 'entrainement') {
      let sortedPlayers = [...players].sort((a, b) => getAvg(b) - getAvg(a));
      generatedTeams = Array.from({ length: config.numTeams }, () => []);
      
      let playerCounter = 0;
      sortedPlayers.forEach((p) => {
        if (playerCounter < config.numTeams * config.playersPerTeam) {
            const teamIndex = Math.floor(playerCounter / config.numTeams) % 2 === 0 
                ? playerCounter % config.numTeams 
                : config.numTeams - 1 - (playerCounter % config.numTeams);
            generatedTeams[teamIndex].push(p);
            playerCounter++;
        } else {
            leftover.push(p);
        }
      });

    } else if (mode === 'match') {
      const matchRoles = ['P', 'R4', 'C', 'Pt', 'R4', 'L', 'C']; 
      let t1 = new Array(7).fill(null);
      let availablePlayers = [...players].sort((a, b) => getAvg(b) - getAvg(a));

      Object.keys(config.lockedRoles).forEach(playerId => {
          const forceRole = config.lockedRoles[playerId];
          const pIndex = availablePlayers.findIndex(p => p.id === playerId);
          if (pIndex !== -1) {
              const p = availablePlayers[pIndex];
              const t1Slot = matchRoles.findIndex((r, i) => r === forceRole && t1[i] === null);
              if (t1Slot !== -1) t1[t1Slot] = p;
              else leftover.push(p);
              availablePlayers.splice(pIndex, 1);
          }
      });

      t1.forEach((slot, idx) => {
          if (slot === null) {
              const neededRole = matchRoles[idx];
              const bestMatchIdx = availablePlayers.findIndex(p => getShortRole(p.posteEquipe) === neededRole);
              if (bestMatchIdx !== -1) {
                  t1[idx] = availablePlayers[bestMatchIdx];
                  availablePlayers.splice(bestMatchIdx, 1);
              } else if (availablePlayers.length > 0) {
                  t1[idx] = availablePlayers[0];
                  availablePlayers.splice(0, 1);
              }
          }
      });

      generatedTeams = [t1];
      leftover = [...leftover, ...availablePlayers];
    }

    setTeams(generatedTeams);
    setBench(leftover);
    setTimeout(() => setIsGenerating(false), 800);
  };

  // ========================================================
  // 2. ÉCHANGE (DRAG & DROP TACTILE)
  // ========================================================
  const handleSlotClick = (type, teamIndex, playerIndex, player) => {
    if (!swapMode) {
      if (player) setSelectedEntity({ type, teamIndex, playerIndex, player }); 
      return;
    }
    if (selectedEntity) {
      let newTeams = [...teams];
      let newBench = [...bench];

      const playerA = selectedEntity.player;
      const playerB = player; 

      if (selectedEntity.type === 'court') newTeams[selectedEntity.teamIndex][selectedEntity.playerIndex] = playerB;
      if (selectedEntity.type === 'bench') newBench[selectedEntity.playerIndex] = playerB;

      if (type === 'court') newTeams[teamIndex][playerIndex] = playerA;
      if (type === 'bench') newBench[playerIndex] = playerA;

      setTeams(newTeams);
      setBench(newBench);
      setSwapMode(false);
      setSelectedEntity(null);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Wand2 size={48} className="text-indigo-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">L'algorithme calcule...</h2>
      </div>
    );
  }

  // --- NOUVEAU : Logique d'affichage de l'Avatar dans la Modale ---
  let selectedAvatarContent = null;
  if (selectedEntity && selectedEntity.player) {
      const p = selectedEntity.player;
      const isBeta = p.id && p.id.length < 10;
      if (p.photoURL) {
          selectedAvatarContent = <img src={p.photoURL} alt="avatar" className="w-full h-full object-cover" />;
      } else if (isBeta) {
          selectedAvatarContent = <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.prenom}${p.nom}&backgroundColor=e2e8f0`} alt="avatar" className="w-full h-full object-cover" />;
      } else {
          selectedAvatarContent = <User size={32} className="text-gray-400" />;
      }
  }

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex justify-between items-center mb-6">
        <button onClick={goBack} className="text-indigo-600 text-sm font-bold">← Reconfigurer</button>
        <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Mode {mode}</div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {mode === 'match' ? "Composition d'Équipe (Match)" : "Équipes d'Entraînement"}
        </h2>
        {swapMode && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">Mode Échange actif</span>}
      </div>

      <div className={`grid grid-cols-1 ${mode === 'match' ? 'max-w-2xl mx-auto' : 'md:grid-cols-2'} gap-8`}>
        {teams.map((teamPlayers, tIndex) => (
          <div key={tIndex}>
            {mode !== 'match' && (
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Équipe {tIndex + 1} ({teamPlayers.filter(p=>p).length} joueurs)
              </h3>
            )}
            
            <Court 
              players={teamPlayers} 
              teamIndex={tIndex}
              onClickSlot={(pIndex, p) => handleSlotClick('court', tIndex, pIndex, p)}
              selectedEntity={selectedEntity}
              swapMode={swapMode}
              mode={mode}
              config={config}
            />
            
            <TeamStatsCard players={teamPlayers.filter(p => p !== null)} mode={mode} />
          </div>
        ))}
      </div>

      {(bench.length > 0 || swapMode) && (
        <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            {mode === 'match' ? 'Banc des Remplaçants' : 'Banc de touche / Réserve'}
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1">
            {bench.map((player, index) => (
              <PlayerNode 
                key={index} player={player} 
                isSelected={selectedEntity?.type === 'bench' && selectedEntity.playerIndex === index}
                swapMode={swapMode} onClick={() => handleSlotClick('bench', -1, index, player)}
              />
            ))}
            {swapMode && (
              <div onClick={() => handleSlotClick('bench', -1, bench.length, null)} className="min-w-[60px] h-[60px] rounded-full border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center cursor-pointer mt-1"><span className="text-xs text-orange-500 font-bold">+ Poser</span></div>
            )}
          </div>
        </div>
      )}

      {/* MODALE DU JOUEUR */}
      {selectedEntity && !swapMode && selectedEntity.player && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center sm:items-center">
            <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-fade-in-up relative">
                <button onClick={() => setSelectedEntity(null)} className="absolute top-4 right-4 text-gray-400 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200"><X size={20}/></button>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full border-2 border-indigo-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                        {selectedAvatarContent}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{selectedEntity.player.prenom} {selectedEntity.player.nom}</h3>
                        <p className="text-sm text-gray-500">{selectedEntity.player.posteEquipe}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {Object.entries(selectedEntity.player.stats).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex justify-between items-center"><span className="text-xs font-bold text-gray-600 capitalize">{key}</span><span className={`text-sm font-bold px-2 py-0.5 rounded ${value >= 7 ? 'bg-green-100 text-green-700' : value <= 4 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{value}</span></div>
                    ))}
                </div>
                <button onClick={() => setSwapMode(true)} className="w-full bg-orange-100 text-orange-700 font-bold py-3 rounded-xl border border-orange-200 flex justify-center gap-2"><ArrowLeftRight size={20} /> Échanger / Déplacer</button>
            </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// LE COMPOSANT DU TERRAIN (GÉOMÉTRIE ADAPTATIVE)
// ========================================================
function Court({ players, teamIndex, onClickSlot, selectedEntity, swapMode, mode, config }) {
  const getLayout = (mode, count) => {
    if (mode === 'match') return [
      { top: '80%', left: '85%', role: 'P' },    
      { top: '25%', left: '85%', role: 'R4' },   
      { top: '25%', left: '50%', role: 'C' },    
      { top: '25%', left: '15%', role: 'Pt' },   
      { top: '80%', left: '15%', role: 'R4' },   
      { top: '80%', left: '50%', role: 'L' },    
      { top: '15%', left: '0%', role: 'C' }      
    ];
    if (count === 4) return [
      { top: '25%', left: '50%' }, { top: '50%', left: '20%' }, { top: '50%', left: '80%' }, { top: '80%', left: '50%' }
    ];
    if (count === 5) return [
      { top: '25%', left: '50%' }, { top: '45%', left: '15%' }, { top: '45%', left: '85%' }, { top: '80%', left: '30%' }, { top: '80%', left: '70%' }
    ];
    return [
      { top: '80%', left: '85%' }, { top: '25%', left: '85%' }, { top: '25%', left: '50%' }, { top: '25%', left: '15%' }, { top: '80%', left: '15%' }, { top: '80%', left: '50%' }
    ];
  };

  const layout = getLayout(mode, mode === 'match' ? 7 : config.playersPerTeam);
  const showRoles = mode === 'match';

  return (
    <div className="bg-orange-50 border-4 border-orange-300 rounded-lg p-2 relative h-96 shadow-inner w-full overflow-visible">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gray-300 flex justify-center z-10"><div className="w-full border-b-2 border-dashed border-gray-400"></div></div>
      <div className="absolute top-[33%] left-0 right-0 h-1 bg-orange-300/50"></div>

      {layout.map((pos, i) => {
        const player = players[i];
        return (
          <div key={i} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ top: pos.top, left: pos.left }}>
            <PlayerNode 
              player={player} roleTerrain={showRoles ? pos.role : null}
              isSelected={selectedEntity?.type === 'court' && selectedEntity.teamIndex === teamIndex && selectedEntity.playerIndex === i}
              swapMode={swapMode} onClick={() => onClickSlot(i, player)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ========================================================
// LE COMPOSANT DU JOUEUR (AVEC PHOTO, NOM ET NOTE EN DESSOUS)
// ========================================================
function PlayerNode({ player, roleTerrain, isSelected, swapMode, onClick }) {
  const convertRoleToShort = (longRole) => {
    if (!longRole) return '';
    if (longRole.includes('Passeur')) return 'P';
    if (longRole.includes('Pointu')) return 'Pt';
    if (longRole.includes('R4')) return 'R4';
    if (longRole.includes('Central')) return 'C';
    if (longRole.includes('Libéro')) return 'L';
    return '';
  };

  const displayRole = roleTerrain || convertRoleToShort(player?.posteEquipe);
  const roleColors = { 'P': 'bg-blue-500', 'Pt': 'bg-red-500', 'R4': 'bg-green-500', 'C': 'bg-yellow-500', 'L': 'bg-purple-500' };
  const color = roleColors[displayRole] || 'bg-gray-500';

  const average = player ? (Object.values(player.stats).reduce((a, b) => a + b, 0) / 6).toFixed(1) : 0;
  
  // --- NOUVEAU : Logique d'affichage de l'Avatar de Terrain ---
  const isBeta = player && player.id && player.id.length < 10;
  
  let avatarContent;
  if (!player) {
      avatarContent = <span className="text-[10px] text-gray-400 font-bold">Vide</span>;
  } else if (player.photoURL) {
      avatarContent = <img src={player.photoURL} alt="Profil" className="w-full h-full object-cover" />;
  } else if (isBeta) {
      avatarContent = <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.prenom}${player.nom}&backgroundColor=e2e8f0`} alt="Profil" className="w-full h-full object-cover" />;
  } else {
      avatarContent = <User size={24} className="text-gray-400" />;
  }

  return (
    <div onClick={onClick} className={`relative flex flex-col items-center cursor-pointer transition-all duration-200 ${isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'} ${swapMode && !isSelected ? 'animate-pulse' : ''}`}>
        
        <div className="relative">
          {displayRole && player && (
              <div className={`absolute -top-1 -right-2 ${color} text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md z-30 border border-white`}>{displayRole}</div>
          )}
          <div className={`bg-gray-100 w-14 h-14 rounded-full shadow-md border-2 flex items-center justify-center overflow-hidden
              ${isSelected ? 'border-indigo-500 shadow-indigo-500/50' : swapMode && !player ? 'border-orange-400 border-dashed bg-orange-50' : 'border-gray-300'}`}>
              {avatarContent}
          </div>
        </div>

        {player && (
          <div className="mt-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-gray-100 text-center min-w-[50px]">
            <p className="text-[10px] font-bold text-gray-800 leading-tight truncate max-w-[60px]">{player.prenom}</p>
            <p className="text-[9px] font-bold text-indigo-600">⭐ {average}</p>
          </div>
        )}
    </div>
  );
}

// ========================================================
// CALCULATEUR DE STATS DE L'ÉQUIPE
// ========================================================
function TeamStatsCard({ players, mode }) {
  if (!players || players.length === 0) return null;

  const getAttackAvg = () => {
    const list = players.filter(p => !p.posteEquipe.includes('Libéro'));
    if (list.length === 0) return 5;
    return list.reduce((acc, p) => acc + (p.stats.attaque || 5), 0) / list.length;
  };

  const getReceptionAvg = () => {
    const list = players.filter(p => p.posteEquipe.includes('R4') || p.posteEquipe.includes('Libéro') || p.posteEquipe.includes('Polyvalent'));
    if (list.length === 0) return players.reduce((acc, p) => acc + (p.stats.reception || 5), 0) / players.length;
    return list.reduce((acc, p) => acc + (p.stats.reception || 5), 0) / list.length;
  };

  const getPasseWeightedAvg = () => {
    let totalScore = 0;
    let totalWeight = 0;
    players.forEach(p => {
      const isPasseur = p.posteEquipe.includes('Passeur');
      const weight = isPasseur ? 3 : 1;
      totalScore += (p.stats.passe || 5) * weight;
      totalWeight += weight;
    });
    return totalWeight > 0 ? totalScore / totalWeight : 5;
  };

  const getServiceAvg = () => {
    const list = players.filter(p => !p.posteEquipe.includes('Libéro'));
    if (list.length === 0) return 5;
    return list.reduce((acc, p) => acc + (p.stats.service || 5), 0) / list.length;
  };

  const getDefenseBlocAvg = () => {
    const sumBloc = players.reduce((acc, p) => acc + (p.stats.bloc || 5), 0);
    const sumDef = players.reduce((acc, p) => acc + (p.stats.defense || 5), 0);
    return ((sumBloc / players.length) + (sumDef / players.length)) / 2;
  };

  const att = getAttackAvg();
  const rec = getReceptionAvg();
  const pas = getPasseWeightedAvg();
  const srv = getServiceAvg();
  const defBloc = getDefenseBlocAvg();

  const globalScore = Math.round(((att + rec + pas + srv + defBloc) / 5) * 10);
  
  const statsMap = { 'attaque': att, 'réception': rec, 'passe': pas, 'service': srv, 'défense/bloc': defBloc };
  const sortedStats = Object.entries(statsMap).sort((a, b) => b[1] - a[1]);
  const best = sortedStats[0];
  const worst = sortedStats[sortedStats.length - 1];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
      <div className="flex justify-between text-sm font-bold text-gray-700 mb-2"><span>Force globale de cette composition</span><span className="text-indigo-600">{globalScore || 0} / 100</span></div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden"><div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${globalScore || 0}%` }}></div></div>
      <div className="flex justify-between text-[11px] text-gray-500 font-medium capitalize">
        {best && <span className="flex items-center gap-1 text-green-600"><Activity size={12}/> Fort: {best[0]}</span>}
        {worst && <span className="flex items-center gap-1 text-orange-500"><Info size={12}/> Faible: {worst[0]}</span>}
      </div>
    </div>
  );
}