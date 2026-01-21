import {usePoules, useInvitations} from "@/hooks/usePoules";
import {useAuth0} from "@auth0/auth0-react";
import {SimpleTimer} from "@/components/countdowntimer";

interface PoulesSectionProps {
    onViewDetail: (pouleId: string) => void;
    onNavigate: (view: "poules" | "invitations" | "create" | "detail" | "historique") => void;
}

export default function PoulesSection({onViewDetail, onNavigate}: PoulesSectionProps) {
    const {isAuthenticated, loginWithRedirect} = useAuth0();
    const {poulesEnCours, loading: poulesLoading, refetch} = usePoules();
    const {invitations} = useInvitations();
    const activePoules = poulesEnCours.filter(p => p.status !== "terminee");


    // Si non connecté, afficher un message
    if (!isAuthenticated) {
        return (
            <div className="poules-section">
                <div className="section-header">
                    <h1 className="section-title">🏆 Mes Poules</h1>
                </div>
                <div style={{
                        textAlign: "center",
                        padding: "4rem 2rem",
                        background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                        borderRadius: "16px",
                        color: "white"
                    }}>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                        🔒 Connectez-vous pour accéder aux poules !
                    </h2>
                    <p style={{ marginBottom: "2rem", opacity: 0.9 }}>
                        Créez des compétitions avec vos amis et défiez-vous sur les jeux du Saint-Laurent
                    </p>
                    <button
                        onClick={() => loginWithRedirect()}
                        style={{
                        padding: "1rem 2rem",
                        fontSize: "1.1rem",
                        borderRadius: "12px",
                        border: "none",
                        background: "white",
                        color: "#6366f1",
                        fontWeight: "600",
                        cursor: "pointer"
                        }}
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        );
    }

    if (poulesLoading) {
        return (
            <div className="poules-section">
                <div className="section-header">
                    <h1 className="section-title">🏆 Mes Poules</h1>
                </div>
                <div style={{textAlign: "center", padding: "2rem"}}>Chargement...</div>
            </div>
        );
    }

    return (
        <div className="poules-section">
            <div className="section-header">
                <h1 className="section-title">🏆 Mes Poules</h1>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <div 
                    className="action-card create-card"
                    onClick={() => onNavigate("create")}
                    >
                    <div className="action-icon">➕</div>
                    <h3>Créer une Poule</h3>
                    <p>Lance un nouveau défi avec tes amis pour la semaine</p>
                </div>

                <div 
                    className="action-card invitations-card"
                    onClick={() => onNavigate("invitations")}
                    >
                    <div className="action-icon">📧</div>
                    <h3>
                        Invitations <span className="badge">{invitations.length}</span>
                    </h3>
                    <p>Tu as des invitations en attente !</p>
                </div>
            </div>

            {/* Poules en cours */}
            <div className="poules-list">
                <h2 className="list-title">🔥 Poules en cours</h2>

                {activePoules.length === 0 ? (
                    <div style={{textAlign: "center", padding: "2rem", color: "#6b7280"}}>
                        Aucune poule en cours. Crée-en une ou accepte une invitation !
                    </div>
                ) : (
                    activePoules.map((poule) => (
                        <div key={poule.id} className={`poule-card ${poule.status}`}>
                            <div className="poule-header">
                                <h3 className="poule-name">
                                    <span className="poule-emoji">{poule.emoji}</span>
                                    {poule.name}
                                </h3>
                                <span className={`status-badge ${poule.status}`}>
                                    {poule.status === "en-cours" ? "En cours" : "Fin proche"}
                                </span>
                            </div>

                            <div className="poule-info">
                                <div className="info-item">
                                    <span className="info-icon">⏱️</span>
                                    <div>
                                        <div className="info-label">Temps restant</div>
                                        <div className="info-value">
                                            <SimpleTimer timeRemainingSeconds={poule.time_remaining_seconds} />
                                        </div>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <span className="info-icon">👥</span>
                                    <div>
                                        <div className="info-label">Participants</div>
                                        <div className="info-value">
                                            {poule.participants}/{poule.max_participants}
                                        </div>
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
                                                    {poule.my_position === 1 ? "er" : "ème"}{" "}
                                                    {poule.my_position === 1 && "🔥"}
                                                </>
                                            ) : (
                                                "Pas encore joué"
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="view-ranking-btn"
                                onClick={() => onViewDetail(poule.id.toString())}
                            >
                                Voir le classement
                            </button>
                        </div>
                        )
                    )
                )}
            </div>

            {/* Voir les archives */}
            <button 
                className="see-historique-btn"
                onClick={() => onNavigate("historique")}
            >
                📦 Voir l'historique
            </button>
        </div>
    );
}