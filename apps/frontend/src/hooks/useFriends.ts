import {useState, useEffect} from "react";
import {useAuth0} from "@auth0/auth0-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Friend {
    id: number;
    name: string;
    email: string;
    picture: string;
}

interface FriendsResponse {
    friends: Friend[];
}

export function useFriends() {
    const {getAccessTokenSilently, isAuthenticated} = useAuth0();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFriends = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            
            const url = `${API_BASE_URL}/userRelation/my-friends`;
            console.log("Fetching friends from:", url);
            
            const response = await fetch(url, {
                    headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
            const text = await response.text();
            console.error("Response text:", text);
            throw new Error(`Erreur ${response.status}: ${text}`);
        }

        const data: FriendsResponse = await response.json();
        console.log("Friends data:", data);
        
        setFriends(data.friends || []);
        setError(null);
        } catch (err: any) {
            console.error("Erreur fetch friends:", err);
            setError(err.message);
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, [isAuthenticated]);

    return {friends, loading, error, refetch: fetchFriends};
}