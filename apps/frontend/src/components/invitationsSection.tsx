import {useInvitations, formatTimeRemaining} from "@/hooks/usePoules";

interface InvitationsSectionProps {
    onBack: () => void;
}

export default function InvitationsSection({ onBack }: InvitationsSectionProps) {
    const {invitations, loading, respondToInvitation} = useInvitations();

    const handleAccept = async (id: number) => {
        const success = await respondToInvitation(id, true);
        if (success) {
            console.log("Invitation acceptée");
        }
    };

    const handleRefuse = async (id: number) => {
        const success = await respondToInvitation(id, false);
        if (success) {
            console.log("Invitation refusée");
        }
    };

    const formatStartTime = (seconds: number) => {
        if (seconds <= 0) {
            // La poule a déjà commencé
            const hoursAgo = Math.floor(Math.abs(seconds) / 3600);
            const daysAgo = Math.floor(hoursAgo / 24);
            
            if (daysAgo > 0) {
                return `Commencée il y a ${daysAgo}j`;
            } else if (hoursAgo > 0) {
                return `Commencée il y a ${hoursAgo}h`;
            } else {
                return "Vient de commencer";
            }
        }
        
        const hours = Math.floor(seconds / 3600);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `Dans ${days}j`;
        } else if (hours > 0) {
            return `Dans ${hours}h`;
        } else {
            return `Dans ${Math.floor(seconds / 60)}m`;
        }
    };

    const formatRejouable = (rejouable: string) => {
        if (rejouable === "non") return "Non";
        if (rejouable === "unlimited") return "Oui (illimité)";
        return `Oui (${rejouable}x)`;
    };

    if (loading) {
        return (
        <div className="invitations-section">
            <div className="section-header">
                <h1 className="section-title">📧 Invitations</h1>
            </div>
            <div style={{ textAlign: "center", padding: "2rem" }}>Chargement...</div>
            <button className="back-btn" onClick={onBack}>
                ← Retour
            </button>
        </div>
        );
    }

    return (
        <div className="invitations-section">
            <div className="section-header">
                <h1 className="section-title">
                    📧 Invitations
                    <span className="badge">{invitations.length} en attente</span>
                </h1>
            </div>

            <div className="invitations-list">
                {invitations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        Aucune invitation en attente
                    </div>
                ) : (
                    invitations.map((invitation) => (
                        <div key={invitation.id} className="invitation-card">
                            <div className="invitation-header">
                                <span className="invitation-from">
                                Invitation de {invitation.inviter_name}
                                </span>
                            </div>

                            <h3 className="invitation-name">
                                <span className="invitation-emoji">{invitation.poule_emoji}</span>
                                {invitation.poule_name}
                            </h3>

                            <div className="invitation-info">
                                <div className="info-row">
                                    <div className="info-item">
                                        <span className="info-icon">🎮</span>
                                        <div>
                                        <div className="info-label">Jeu</div>
                                        <div className="info-value">{invitation.defi_name}</div>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <span className="info-icon">👥</span>
                                        <div>
                                            <div className="info-label">Participants</div>
                                            <div className="info-value">
                                                {invitation.participants}/{invitation.max_participants}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="info-row">
                                    <div className="info-item">
                                        <span className="info-icon">⏰</span>
                                        <div>
                                            <div className="info-label">Début</div>
                                            <div className="info-value">
                                                {formatStartTime(invitation.time_until_start_seconds)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <span className="info-icon">🔄</span>
                                        <div>
                                            <div className="info-label">Rejouable</div>
                                            <div className="info-value">
                                                {formatRejouable(invitation.rejouable)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="invitation-actions">
                                <button
                                    className="accept-btn"
                                    onClick={() => handleAccept(invitation.id)}
                                    >
                                    ✓ Accepter
                                </button>
                                <button
                                    className="refuse-btn"
                                    onClick={() => handleRefuse(invitation.id)}
                                    >
                                    ✕ Refuser
                                </button>
                            </div>
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