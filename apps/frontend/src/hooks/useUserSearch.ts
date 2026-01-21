import {useState} from "react";
import {useAuth0} from "@auth0/auth0-react";

export interface User {
    id: number;
    name: string;
    email: string;
    picture: string;
}

export function useUserSearch() {
    const {getAccessTokenSilently, isAuthenticated} = useAuth0();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const searchUsers = async (query: string) => {
        if (!isAuthenticated || query.length < 2) {
            setUsers([]);
            return;
        }

        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/userSearch/?query=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Erreur recherche users");

            const data = await response.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error("Erreur searchUsers:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    return {users, loading, searchUsers};
}