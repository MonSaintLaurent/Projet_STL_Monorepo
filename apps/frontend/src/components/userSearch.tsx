import {useState, useEffect} from "react";
import {useUserSearch, User as SearchUser} from "@/hooks/useUserSearch";
import {useFriends} from "@/hooks/useFriends";

export interface User {
    id: number;
    name: string;
    email: string;
    picture: string;
}

interface UserSearchProps {
    onInvite: (user: User) => void;       // Ajouter à la poule
    onAddFriend: (user: User) => void;    // Envoyer demande d'ami
    excludeIds?: number[];                // ids déjà sélectionnés
}

export default function UserSearch({ onInvite, onAddFriend, excludeIds = [] }: UserSearchProps) {
    const [query, setQuery] = useState("");
    const { users, loading, searchUsers } = useUserSearch();
    const { friends, loading: friendsLoading } = useFriends();
    const [friendIds, setFriendIds] = useState<number[]>([]);
    const [pendingIds, setPendingIds] = useState<number[]>([]);

    useEffect(() => {
        if (!friendsLoading) setFriendIds(friends.map(f => f.id));
    }, [friends, friendsLoading]);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (query.length >= 2) searchUsers(query);
        }, 300);
        return () => clearTimeout(delay);
    }, [query]);

    const filteredUsers = users.filter(u => !excludeIds.includes(u.id));

    const handleAddFriend = (user: User) => {
        onAddFriend(user);
        setPendingIds([...pendingIds, user.id]);
    };

    return (
        <div className="user-search">
            <input
                type="text"
                placeholder="Rechercher un ami..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-input"
            />

            {loading && <div style={{ padding: "0.5rem" }}>Chargement...</div>}

            {!loading && query.length >= 2 && filteredUsers.length > 0 && (
                <ul style={{ marginTop: "0.5rem" }}>
                    {filteredUsers.map(user => {
                        const isFriend = friendIds.includes(user.id);
                        const isPending = pendingIds.includes(user.id);
                        return (
                            <li
                                key={user.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.5rem",
                                    borderBottom: "1px solid #eee"
                                }}
                            >
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <span style={{ fontWeight: "bold" }}>{user.name.charAt(0)}</span>
                                    <div>
                                        <div>{user.name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{user.email}</div>
                                    </div>
                                </div>
                                <div>
                                    {isFriend
                                        ? <button onClick={() => onInvite(user)} style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", backgroundColor: "#10b981", color: "white", border: "none" }}>Inviter</button>
                                        : <button onClick={() => handleAddFriend(user)} disabled={isPending} style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", backgroundColor: isPending ? "#fbbf24" : "#6366f1", color: "white", border: "none" }}>{isPending ? "En attente" : "Ajouter"}</button>
                                    }
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {!loading && query.length >= 2 && filteredUsers.length === 0 && (
                <div style={{ padding: "0.5rem", color: "#6b7280" }}>Aucun résultat</div>
            )}
        </div>
    );
}
