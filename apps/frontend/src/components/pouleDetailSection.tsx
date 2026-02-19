import {usePouleRanking, formatTimeRemaining, formatTimeAgo} from "@/hooks/usePoules";
import {useNavigate} from "react-router-dom";
import {useAuth0} from "@auth0/auth0-react";

interface PouleDetailSectionProps {
    pouleId: string;
    onBack: () => void;
}

export default function PouleDetailSection({
    pouleId,
    onBack,
}: PouleDetailSectionProps) {
    const {pouleDetail, ranking, loading} = usePouleRanking(parseInt(pouleId));
    const navigate = useNavigate();
    const {getAccessTokenSilently} = useAuth0(); 
    if (loading || !pouleDetail) {
        return (
            <div className="poule-detail-section">
                <div style={{ textAlign: "center", padding: "2rem" }}>Chargement...</div>
                <button className="back-btn" onClick={onBack}>
                ← Retour
                </button>
            </div>
        );
    }

    const formatRejouable = (rejouable: string) => {
        if (rejouable === "non") return "Non";
        if (rejouable === "unlimited") return "Illimité";
        return `${rejouable} tentatives`;
    };

    const getPlayerInitial = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    const getPlayerColor = (index: number) => {
        const colors = [
            "#9333ea",
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#06b6d4",
            "#84cc16",
        ];
        return colors[index % colors.length];
    };

    const handlePlayDefi = async () => {
        if (!pouleDetail.defi_route) {
            console.error("defi_route manquante dans pouleDetail");
            return;
        }

        try {
            // Récupérer le token Auth0
            const token = await getAccessTokenSilently();
            
            // Créer une session poule
            const res = await fetch(`${import.meta.env.VITE_API_URL}/poules/start-session`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ poule_id: pouleDetail.id })
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                console.error("Erreur JSON:", err);
                alert("Erreur: la session n'a pas pu être créée");
                return;
            }

            if (!res.ok) {
                alert(data?.detail || "Impossible de démarrer la session");
                return;
            }

            const sessionId = data.session_id;

            // Rediriger vers le jeu en passant session + poule
            navigate(`${pouleDetail.defi_route}?session_id=${sessionId}&poule_id=${pouleDetail.id}`);
        } catch (err) {
            console.error(err);
            alert("Erreur lors du démarrage du défi");
        }
    };


    return (
        <div className="poule-detail-section">
            <div className="detail-header">
                <h1 className="detail-title">
                    <span className="detail-emoji">{pouleDetail.emoji}</span>
                    {pouleDetail.name}
                </h1>
                <span className={`status-badge ${pouleDetail.status}`}>
                    {pouleDetail.status === "en-cours"
                        ? "En cours"
                        : pouleDetail.status === "fin-proche"
                        ? "Fin proche"
                        : "Terminée"}
                </span>
            </div>

            {/* Info bar */}
            <div className="detail-info-bar">
                <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <div>
                        <div className="info-label">Temps restant</div>
                        <div className="info-value">
                            {formatTimeRemaining(pouleDetail.time_remaining_seconds)}
                        </div>
                    </div>
                </div>

                <div className="info-item">
                    <span className="info-icon">👥</span>
                    <div>
                        <div className="info-label">Participants</div>
                        <div className="info-value">{pouleDetail.participants}</div>
                    </div>
                </div>

                <div className="info-item">
                    <span className="info-icon">🎮</span>
                    <div>
                        <div className="info-label">Jeu</div>
                        <div className="info-value">{pouleDetail.defi_name}</div>
                    </div>
                </div>

                <div className="info-item">
                    <span className="info-icon">🔄</span>
                    <div>
                        <div className="info-label">Rejouable</div>
                        <div className="info-value">
                            {formatRejouable(pouleDetail.rejouable)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Classement */}
            <div className="ranking-section">
                <h2 className="ranking-title">🏆 Classement</h2>

                <div className="ranking-list">
                    {ranking.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        Aucun participant n'a encore joué
                        </div>
                    ) : (
                        ranking.map((player, index) => (
                            <div
                                key={player.user_id}
                                className={`ranking-item ${player.is_current_user ? "current-user" : ""} ${
                                player.rank <= 3 ? "podium" : ""
                                }`}
                            >
                                <div className="ranking-left">
                                    {player.rank <= 3 ? (
                                        <div className="medal-icon">
                                            {player.rank === 1 && "🥇"}
                                            {player.rank === 2 && "🥈"}
                                            {player.rank === 3 && "🥉"}
                                        </div>
                                    ) : (
                                        <div className="rank-number">{player.rank}</div>
                                    )}

                                    <div
                                        className="player-avatar"
                                        style={{ backgroundColor: getPlayerColor(index) }}
                                    >
                                        {getPlayerInitial(player.user_name)}
                                    </div>

                                    <div className="player-info">
                                        <div className="player-name">{player.user_name}</div>
                                        <div className="player-status">
                                            {player.last_played_at
                                                ? `A joué ${formatTimeAgo(player.last_played_at)}`
                                                : "N'a pas encore joué aujourd'hui"}
                                        </div>
                                    </div>
                                </div>

                                <div className="ranking-right">
                                    <div className="player-points">
                                        {player.last_played_at
                                            ? `${player.best_score} pts`
                                            : "- pts"}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="detail-actions">
                <button className="back-btn" onClick={onBack}>
                    ← Retour
                </button>

                {pouleDetail.status !== "terminee" && (
                    <button 
                        className="improve-score-btn" 
                        onClick={handlePlayDefi} 
                        disabled={pouleDetail.attempts_left === 0}
                    >
                        {pouleDetail.attempts_left === 0 
                            ? "❌ Plus de tentatives" 
                            : "🎯 Améliorer mon score"}
                    </button>
                )}
            </div>
        </div>
    );
}