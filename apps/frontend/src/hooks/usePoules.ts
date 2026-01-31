import {useState, useEffect} from "react";
import {useAuth0} from "@auth0/auth0-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Types
export interface Poule {
    id: number;
    name: string;
    emoji: string;
    defi_id: number;
    defi_name: string;
    participants: number;
    max_participants: number;
    time_remaining_seconds: number;
    status: "en-cours" | "fin-proche" | "terminee";
    my_position: number | null;
    my_score: number | null;
    rejouable: string;
    start_time: string;
    end_time: string;
}

export interface Invitation {
    id: number;
    poule_id: number;
    poule_name: string;
    poule_emoji: string;
    defi_id: number;
    defi_name: string;
    inviter_name: string;
    participants: number;
    max_participants: number;
    rejouable: string;
    start_time: string;
    time_until_start_seconds: number;
    created_at: string;
}

export interface RankingPlayer {
    rank: number;
    user_id: number;
    user_name: string;
    user_picture: string;
    best_score: number;
    best_time_spent: number;
    total_attempts: number;
    last_played_at: string;
    is_current_user: boolean;
}

export interface PouleDetail {
  id: number;
  name: string;
  emoji: string;
  defi_id: number;
  defi_name: string;
  defi_route: string;
  rejouable: string;
  participants: number;
  time_remaining_seconds: number;
  status: string;
  attempts_left: number;
}

// Hook principal pour les poules
export function usePoules() {
    const {getAccessTokenSilently, isAuthenticated} = useAuth0();
    const [poulesEnCours, setPoulesEnCours] = useState<Poule[]>([]);
    const [poulesTerminees, setPoulesTerminees] = useState<Poule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPoules = async () => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            
            const response = await fetch(`${API_BASE_URL}/poules/my-poules`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Erreur lors du chargement des poules");

            const data = await response.json();
            setPoulesEnCours(data.en_cours || []);
            setPoulesTerminees(data.terminees || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error("Erreur fetch poules:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoules();
    }, [isAuthenticated]);

    return {poulesEnCours, poulesTerminees, loading, error, refetch: fetchPoules};
}

// Hook pour les invitations
export function useInvitations() {
    const {getAccessTokenSilently, isAuthenticated} = useAuth0();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvitations = async () => {
        if (!isAuthenticated) return;

        try {   
            setLoading(true);
            const token = await getAccessTokenSilently();
            
            const response = await fetch(`${API_BASE_URL}/poules/invitations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Erreur lors du chargement des invitations");

            const data = await response.json();
            setInvitations(data.invitations || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error("Erreur fetch invitations:", err);
        } finally {
            setLoading(false);
        }
    };

    const respondToInvitation = async (invitationId: number, accept: boolean) => {
        try {
            const token = await getAccessTokenSilently();
            
            const response = await fetch(`${API_BASE_URL}/poules/invitations/respond`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    invitation_id: invitationId,
                    accept,
                }),
            });

            if (!response.ok) throw new Error("Erreur lors de la réponse à l'invitation");

            await fetchInvitations(); // Rafraîchir la liste
            return true;
        } catch (err: any) {
            console.error("Erreur réponse invitation:", err);
            return false;
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, [isAuthenticated]);

    return {invitations, loading, error, respondToInvitation, refetch: fetchInvitations};
}

// Hook pour le classement d'une poule
export function usePouleRanking(pouleId: number | null) {
    const {getAccessTokenSilently, isAuthenticated} = useAuth0();
    const [pouleDetail, setPouleDetail] = useState<PouleDetail | null>(null);
    const [ranking, setRanking] = useState<RankingPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRanking = async () => {
        if (!isAuthenticated || !pouleId) return;

        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            
            const response = await fetch(`${API_BASE_URL}/poules/${pouleId}/ranking`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Erreur lors du chargement du classement");

            const data = await response.json();
            setPouleDetail(data.poule);
            setRanking(data.ranking || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error("Erreur fetch ranking:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
    }, [pouleId, isAuthenticated]);

    return {pouleDetail, ranking, loading, error, refetch: fetchRanking};
}

// Hook pour créer une poule
export function useCreatePoule() {
    const {getAccessTokenSilently} = useAuth0();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createPoule = async (data: {
        name: string;
        emoji: string;
        defi_id: number;
        max_participants: number;
        rejouable: string;
        duration_days: number;
        start_choice?: string;
        invited_user_ids: number[];
    }) => {
        try {
            setLoading(true);
            setError(null);
            const token = await getAccessTokenSilently();

            const response = await fetch(`${API_BASE_URL}/poules/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Erreur lors de la création de la poule");
            }

            const result = await response.json();
            return result;
        } catch (err: any) {
            setError(err.message);
            console.error("Erreur création poule:", err);
            throw err;
        } finally {
            setLoading(false);
        }
        };
    return {createPoule, loading, error};
}

// Hook pour rechercher des utilisateurs
export function useUserSearch() {
    const {getAccessTokenSilently} = useAuth0();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setUsers([]);
            return;
        }

        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            
            const response = await fetch(
                `${API_BASE_URL}/poules/users/search?query=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Erreur lors de la recherche");

            const data = await response.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error("Erreur recherche users:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    return { users, loading, searchUsers };
}

// Fonction utilitaire pour formater le temps restant
export function formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return "Terminé";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
        return `${days}j ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Fonction utilitaire pour formater la date
export function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

// Fonction utilitaire pour formater "il y a X temps"
export function formatTimeAgo(isoString: string): string {
    const now = new Date();
    const date = new Date(isoString);
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "À l'instant";
    if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)}m`;
    if (diffSeconds < 86400) return `Il y a ${Math.floor(diffSeconds / 3600)}h`;
    return `Il y a ${Math.floor(diffSeconds / 86400)}j`;
}