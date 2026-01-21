import {useState, useEffect} from "react";
import {useCreatePoule, usePoules} from "@/hooks/usePoules";
import {useFriends, Friend} from "@/hooks/useFriends";
import UserSearch from "@/components/userSearch";
import {useUserSearch, User} from "@/hooks/useUserSearch";

interface Player {
  id: number;
  name: string;
  email: string;
  picture: string;
  selected: boolean;
}

interface CreatePouleSectionProps {
  onBack: () => void;
}

export default function CreatePouleSection({ onBack }: CreatePouleSectionProps) {
  const [pouleName, setPouleName] = useState("");
  const [selectedGame, setSelectedGame] = useState(1);
  const [rejouable, setRejouable] = useState("non");
  const [durationDays, setDurationDays] = useState(7);
  const [startChoice, setStartChoice] = useState("immediat");

  const [players, setPlayers] = useState<Player[]>([]);

  const { createPoule, loading: creating } = useCreatePoule();
  const { refetch: refetchPoules } = usePoules();


  const togglePlayer = (playerId: number) => {
    setPlayers(
      players.map(p => p.id === playerId ? { ...p, selected: !p.selected } : p)
    );
  };

  const handleCreate = async () => {
    const selectedPlayers = players.filter(p => p.selected);

    if (!pouleName.trim()) {
      alert("Merci de donner un nom à la poule");
      return;
    }

    try {
      await createPoule({
        name: pouleName,
        emoji: "🏆",
        defi_id: selectedGame,
        max_participants: 8,
        rejouable,
        duration_days: durationDays,   
        start_choice: startChoice,       
        invited_user_ids: selectedPlayers.map(p => p.id),
      });

      await refetchPoules();
      onBack();
    } catch (error) {
      console.error("Erreur création poule:", error);
      alert("Erreur lors de la création de la poule");
    }
  };

  const handleCancel = () => {
    setPouleName("");
    setSelectedGame(1);
    setRejouable("non");
    setPlayers(players.map(p => ({ ...p, selected: false })));
    setStartChoice("immediat");
    setDurationDays(7);
    onBack();
  };

  const getPlayerColor = (index: number) => {
    const colors = ["#9333ea", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];
    return colors[index % colors.length];
  };

  const getPlayerInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="create-poule-section">
      <div className="section-header">
        <h1 className="section-title">➕ Créer une Poule</h1>
      </div>

      <div className="create-form">
        {/* Nom de la poule */}
        <div className="form-group">
          <label className="form-label">✏️ Nom de la poule</label>
          <input
            type="text"
            className="form-input"
            placeholder="Challenge des Champions"
            value={pouleName}
            onChange={(e) => setPouleName(e.target.value)}
          />
        </div>

        {/* Jeu sélectionné */}
        <div className="form-group">
          <label className="form-label">🎮 Jeu sélectionné</label>
          <select
            className="form-select"
            value={selectedGame}
            onChange={(e) => setSelectedGame(parseInt(e.target.value))}
          >
            <option value={1}>Dépollue ton Saint-Laurent</option>
            <option value={2}>Trouve la Valeur</option>
          </select>
        </div>

        {/* Début de la poule */}
        <div className="form-group">
          <label className="form-label">🕒 Début de la poule</label>
          <select
            className="form-select"
            value={startChoice}
            onChange={(e) => setStartChoice(e.target.value)}
          >
            <option value="immediat">Immédiat</option>
            <option value="1j">Demain</option>
            <option value="3j">Dans 3 jours</option>
            <option value="1s">Dans 1 semaine</option>
          </select>
        </div>

        {/* Durée */}
        <div className="form-group">
          <label className="form-label">⏱️ Durée de la poule</label>
          <select
            className="form-select"
            value={durationDays}
            onChange={(e) => setDurationDays(parseInt(e.target.value))}
          >
            <option value={3}>3 jours</option>
            <option value={5}>5 jours</option>
            <option value={7}>1 semaine</option>
          </select>
        </div>

        {/* Tentatives rejouables */}
        <div className="form-group">
          <label className="form-label">🔄 Tentatives rejouables ?</label>
          <select
            className="form-select"
            value={rejouable}
            onChange={(e) => setRejouable(e.target.value)}
          >
            <option value="non">Non - Une seule tentative</option>
            <option value="2">Oui - 2 tentatives</option>
            <option value="unlimited">Oui - Illimité (meilleur score)</option>
          </select>
        </div>

        {/* Recherche et sélection des joueurs */}
        <div className="form-group">
          <label className="form-label">
            👥 Inviter des joueurs ({players.filter(p => p.selected).length}{" "}
            sélectionné{players.filter(p => p.selected).length > 1 ? "s" : ""})
          </label>

          <UserSearch
            excludeIds={players.map(p => p.id)}
            onInvite={(user: User) => setPlayers([...players, {...user, selected: true}])}
            onAddFriend={(user: User) => console.log("Demande d'ami envoyée à", user.name)}
          />

          <div className="players-grid" style={{ marginTop: "0.5rem" }}>
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`player-card ${player.selected ? "selected" : ""}`}
                onClick={() => togglePlayer(player.id)}
              >
                <div
                  className="player-avatar-large"
                  style={{ backgroundColor: getPlayerColor(index) }}
                >
                  {getPlayerInitial(player.name)}
                </div>
                <div className="player-name">{player.name}</div>
                {player.selected && <div className="check-mark">✓</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button className="cancel-btn" onClick={handleCancel} disabled={creating}>
            ✕ Annuler
          </button>
          <button
            className="create-btn"
            onClick={handleCreate}
            disabled={!pouleName.trim() || creating}
          >
            {creating ? "Création..." : "🚀 Créer la poule"}
          </button>
        </div>
      </div>
    </div>
  );
}
