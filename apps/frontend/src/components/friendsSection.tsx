import {useState, useEffect} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {useFriends} from "@/hooks/useFriends";
import {useUserSearch} from "@/hooks/useUserSearch";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

interface PendingRequest {
    id: number;
    from_user_id: number;
    to_user_id?: number;
    from_user_name: string;
    to_user_name?: string;
}

interface UserRelation {
    user_id: number;
    status: "friend" | "pending_sent" | "pending_received" | "none";
    relation_id?: number;
}

export default function FriendsSection() {
    const { getAccessTokenSilently } = useAuth0();
    const { friends, refetch: refetchFriends } = useFriends();
    const { users, loading: searchLoading, searchUsers } = useUserSearch();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
    const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
    const [userRelations, setUserRelations] = useState<Map<number, UserRelation>>(new Map());
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Charger toutes les relations pour déterminer les statuts
    const fetchAllRelations = async () => {
        try {
            const token = await getAccessTokenSilently();
            
            // Récupérer demandes reçues
            const receivedRes = await fetch(`${API_BASE_URL}/userRelation/pending-requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (receivedRes.ok) {
                const receivedData = await receivedRes.json();
                setPendingReceived(receivedData.pending_requests || []);
                
                // Ajouter au map
                const newRelations = new Map(userRelations);
                receivedData.pending_requests?.forEach((req: PendingRequest) => {
                    newRelations.set(req.from_user_id, {
                        user_id: req.from_user_id,
                        status: "pending_received",
                        relation_id: req.id
                    });
                });
                setUserRelations(newRelations);
            }
        } catch (err) {
            console.error("Erreur chargement demandes reçues:", err);
        }
    };

    // Charger les demandes envoyées
    const fetchSentRequests = async () => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${API_BASE_URL}/userRelation/sent-requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.ok) {
                const data = await response.json();
                setPendingSent(data.sent_requests || []);
                
                // Ajouter au map
                const newRelations = new Map(userRelations);
                data.sent_requests?.forEach((req: PendingRequest) => {
                    newRelations.set(req.to_user_id!, {
                        user_id: req.to_user_id!,
                        status: "pending_sent",
                        relation_id: req.id
                    });
                });
                setUserRelations(newRelations);
            }
        } catch (err) {
            console.error("Erreur chargement demandes envoyées:", err);
        }
    };

    // Mettre à jour les relations quand les amis changent
    useEffect(() => {
        const newRelations = new Map(userRelations);
        friends.forEach(friend => {
            newRelations.set(friend.id, {
                user_id: friend.id,
                status: "friend"
            });
        });
        setUserRelations(newRelations);
    }, [friends]);

    // Envoyer une demande d'ami
    const sendFriendRequest = async (userId: number) => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${API_BASE_URL}/userRelation/request`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ to_user_id: userId }),
            });
            
            if (response.ok) {
                const data = await response.json();
                // Mettre à jour le map
                const newRelations = new Map(userRelations);
                newRelations.set(userId, {
                    user_id: userId,
                    status: "pending_sent",
                    relation_id: data.relation_id
                });
                setUserRelations(newRelations);
                
                // Recharger les demandes envoyées
                await fetchSentRequests();
            }
        } catch (err) {
            console.error("Erreur envoi demande:", err);
        }
    };

    // Annuler une demande envoyée
    const cancelSentRequest = async (relationId: number, userId: number) => {
        try {
        const token = await getAccessTokenSilently();
            const response = await fetch(`${API_BASE_URL}/userRelation/cancel/${relationId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.ok) {
                const newRelations = new Map(userRelations);
                newRelations.delete(userId);
                setUserRelations(newRelations);
                await fetchSentRequests();
            }
        } catch (err) {
            console.error("Erreur annulation demande:", err);
        }
    };

    // Répondre à une demande
    const respondToRequest = async (relationId: number, userId: number, accept: boolean) => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${API_BASE_URL}/userRelation/respond`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ relation_id: relationId, accept }),
            });
            
            if (response.ok) {
                const newRelations = new Map(userRelations);
                if (accept) {
                    newRelations.set(userId, { user_id: userId, status: "friend" });
                } else {
                    newRelations.delete(userId);
                }
                setUserRelations(newRelations);
                
                await fetchAllRelations();
                await refetchFriends();
            }
        } catch (err) {
            console.error("Erreur réponse demande:", err);
        }
    };

    const toggleSection = async (section: string) => {
        const newSection = expandedSection === section ? null : section;
        setExpandedSection(newSection);
        
        if (newSection === "pending") {
            await fetchAllRelations();
        } else if (newSection === "sent") {
            await fetchSentRequests();
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            searchUsers(query);
        }
    };

    const getRelationStatus = (userId: number): UserRelation => {
        return userRelations.get(userId) || { user_id: userId, status: "none" };
    };

    const renderUserAction = (user: any) => {
        const relation = getRelationStatus(user.id);
        
        switch (relation.status) {
            case "friend":
                return (
                    <span style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        background: "#10b981",
                        color: "white",
                        fontSize: "0.9rem"
                    }}>
                        ✓ Ami
                    </span>
                );
            
            case "pending_sent":
                return (
                    <span style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        background: "#fbbf24",
                        color: "white",
                        fontSize: "0.9rem"
                    }}>
                        ⏳ En attente
                    </span>
                );
            
            case "pending_received":
                return (
                    <span style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        background: "#3b82f6",
                        color: "white",
                        fontSize: "0.9rem"
                    }}>
                        📨 Demande reçue
                    </span>
                );
            
            default:
                return (
                    <button
                        onClick={() => sendFriendRequest(user.id)}
                        style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        border: "none",
                        background: "#6366f1",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                        }}
                    >
                        + Ajouter
                    </button>
                );
        }
    };

    return (
        <div style={{
                maxWidth: "90vw",
                width: "50vw",
                margin: "2rem auto",
                padding: "1.5rem",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
            <h2 style={{ marginBottom: "1rem", color: "#333" }}>👥 Gestion des amis</h2>

            {/* Section Recherche */}
            <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "0.5rem" }}>
                <button
                    onClick={() => toggleSection("search")}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        background: "none",
                        border: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "600"
                    }}
                    >
                    <span>🔍 Rechercher des amis</span>
                    <span>{expandedSection === "search" ? "▼" : "▶"}</span>
                </button>
                
                {expandedSection === "search" && (
                    <div style={{ padding: "0 1rem 1rem" }}>
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                fontSize: "0.95rem"
                            }}
                        />
                        
                        {searchLoading && <p style={{ padding: "1rem", color: "#6b7280" }}>Chargement...</p>}
                        
                        {!searchLoading && searchQuery.length >= 2 && users.length > 0 && (
                            <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
                                {users.map(user => (
                                    <li key={user.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.75rem",
                                        borderBottom: "1px solid #f3f4f6"
                                    }}>
                                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                            <div style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                background: "#6366f1",
                                                color: "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "600"
                                            }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: "500" }}>{user.name}</div>
                                                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{user.email}</div>
                                            </div>
                                        </div>
                                        
                                        {renderUserAction(user)}
                                    </li>
                                ))}
                            </ul>
                        )}
                        
                        {!searchLoading && searchQuery.length >= 2 && users.length === 0 && (
                            <p style={{ padding: "1rem", color: "#6b7280", textAlign: "center" }}>
                                Aucun résultat
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Section Demandes reçues */}
            <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "0.5rem" }}>
                <button
                    onClick={() => toggleSection("pending")}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        background: "none",
                        border: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "600"
                    }}
                    >
                    <span>
                        📨 Demandes reçues
                        {pendingReceived.length > 0 && (
                        <span style={{
                            marginLeft: "0.5rem",
                            padding: "0.25rem 0.5rem",
                            background: "#ef4444",
                            color: "white",
                            borderRadius: "12px",
                            fontSize: "0.75rem"
                        }}>
                            {pendingReceived.length}
                        </span>
                        )}
                    </span>
                    <span>{expandedSection === "pending" ? "▼" : "▶"}</span>
                </button>
                
                {expandedSection === "pending" && (
                    <div style={{ padding: "0 1rem 1rem" }}>
                        {pendingReceived.length === 0 ? (
                            <p style={{ color: "#6b7280", textAlign: "center" }}>Aucune demande en attente</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {pendingReceived.map(req => (
                                    <li key={req.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.75rem",
                                        borderBottom: "1px solid #f3f4f6"
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: "500" }}>{req.from_user_name}</div>
                                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                                veut devenir ami
                                            </div>
                                        </div>
                                            
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button
                                                onClick={() => respondToRequest(req.id, req.from_user_id, true)}
                                                style={{
                                                padding: "0.5rem 1rem",
                                                borderRadius: "6px",
                                                border: "none",
                                                background: "#10b981",
                                                color: "white",
                                                cursor: "pointer",
                                                fontSize: "0.9rem"
                                                }}
                                            >
                                                ✓ Accepter
                                            </button>
                                            <button
                                                onClick={() => respondToRequest(req.id, req.from_user_id, false)}
                                                style={{
                                                padding: "0.5rem 1rem",
                                                borderRadius: "6px",
                                                border: "none",
                                                background: "#ef4444",
                                                color: "white",
                                                cursor: "pointer",
                                                fontSize: "0.9rem"
                                                }}
                                            >
                                                ✕ Refuser
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Section Demandes envoyées */}
            <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "0.5rem" }}>
                <button
                    onClick={() => toggleSection("sent")}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        background: "none",
                        border: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "600"
                    }}
                    >
                    <span>
                        📤 Demandes envoyées
                        {pendingSent.length > 0 && (
                            <span style={{
                                marginLeft: "0.5rem",
                                padding: "0.25rem 0.5rem",
                                background: "#fbbf24",
                                color: "white",
                                borderRadius: "12px",
                                fontSize: "0.75rem"
                            }}>
                                {pendingSent.length}
                            </span>
                        )}
                    </span>
                    <span>{expandedSection === "sent" ? "▼" : "▶"}</span>
                </button>
                
                {expandedSection === "sent" && (
                    <div style={{ padding: "0 1rem 1rem" }}>
                        {pendingSent.length === 0 ? (
                            <p style={{ color: "#6b7280", textAlign: "center" }}>Aucune demande envoyée</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {pendingSent.map(req => (
                                    <li key={req.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.75rem",
                                        borderBottom: "1px solid #f3f4f6"
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: "500" }}>{req.to_user_name}</div>
                                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                                En attente de réponse
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => cancelSentRequest(req.id, req.to_user_id!)}
                                            style={{
                                                padding: "0.5rem 1rem",
                                                borderRadius: "6px",
                                                border: "none",
                                                background: "#6b7280",
                                                color: "white",
                                                cursor: "pointer",
                                                fontSize: "0.9rem"
                                            }}
                                            >
                                            ✕ Annuler
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Section Mes amis */}
            <div>
                <button
                    onClick={() => toggleSection("friends")}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        background: "none",
                        border: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "600"
                    }}
                    >
                    <span>
                        ✅ Mes amis ({friends.length})
                    </span>
                    <span>{expandedSection === "friends" ? "▼" : "▶"}</span>
                </button>
                
                {expandedSection === "friends" && (
                    <div style={{ padding: "0 1rem 1rem" }}>
                        {friends.length === 0 ? (
                        <p style={{ color: "#6b7280", textAlign: "center" }}>
                            Vous n'avez pas encore d'amis. Commencez par en rechercher !
                        </p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {friends.map(friend => (
                                    <li key={friend.id} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                        padding: "0.75rem",
                                        borderBottom: "1px solid #f3f4f6"
                                    }}>
                                        <div style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            background: "#10b981",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "600"
                                            }}>
                                            {friend.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: "500" }}>{friend.name}</div>
                                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{friend.email}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}