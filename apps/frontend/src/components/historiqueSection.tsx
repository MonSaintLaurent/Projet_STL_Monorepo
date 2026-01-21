import {usePoules, formatDate} from "@/hooks/usePoules";

interface HistoriqueSectionProps {
    onBack: () => void;
    onViewDetail: (pouleId: string) => void;
}

export default function HistoriqueSection({
    onBack,
    onViewDetail,
}: HistoriqueSectionProps) {
    const { poulesTerminees, loading } = usePoules();

    if (loading) {
        return (
            <div className="historique-section">
                <div className="section-header">
                    <h1 className="section-title">📦 Historique</h1>
                </div>
                <div style={{ textAlign: "center", padding: "2rem" }}>Chargement...</div>
                <button className="back-btn" onClick={onBack}>
                    ← Retour
                </button>
            </div>
        );
    }

  return (
    <div className="historique-section">
        <div className="section-header">
            <h1 className="section-title">
                📦 Historique
                <span className="badge">{poulesTerminees.length} poules terminées</span>
            </h1>
        </div>

        <div className="historique-list">
            {poulesTerminees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                Aucune poule terminée pour le moment
            </div>
            ) : (
            poulesTerminees.map((poule) => (
                <div key={poule.id} className="historique-card">
                <div className="historique-header">
                    <h3 className="historique-name">
                    <span className="historique-emoji">{poule.emoji}</span>
                    {poule.name}
                    </h3>
                    <span className="terminated-badge">Terminé</span>
                </div>

                <div className="historique-info">
                    <div className="info-item">
                        <span className="info-icon">📅</span>
                        <div>
                            <div className="info-label">Terminé le</div>
                            <div className="info-value">{formatDate(poule.end_time)}</div>
                        </div>
                    </div>

                    <div className="info-item">
                        <span className="info-icon">🎮</span>
                        <div>
                            <div className="info-label">Jeu</div>
                            <div className="info-value">{poule.defi_name}</div>
                        </div>
                    </div>

                    <div className="info-item">
                        <span className="info-icon">🏆</span>
                        <div>
                            <div className="info-label">Ta position</div>
                            <div className="info-value">
                            {poule.my_position ? (
                                <>
                                {poule.my_position}
                                {poule.my_position === 1
                                    ? "er 🥇"
                                    : poule.my_position === 2
                                    ? "ème 🥈"
                                    : poule.my_position === 3
                                    ? "ème 🥉"
                                    : "ème"}
                                </>
                            ) : (
                                "Non classé"
                            )}
                            </div>
                        </div>
                    </div>

                    <div className="info-item">
                        <span className="info-icon">📊</span>
                        <div>
                            <div className="info-label">Score</div>
                            <div className="info-value">
                            {poule.my_score ? `${poule.my_score} pts` : "- pts"}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    className="view-details-btn"
                    onClick={() => onViewDetail(poule.id.toString())}
                >
                    👁️ Voir les détails
                </button>
            </div>
            ))
            )}
        </div>

        <button className="back-btn" onClick={onBack}>
            ← Retour
        </button>
    </div>
  );
}