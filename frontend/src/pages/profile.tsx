import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import DefaultLayout from "@/layouts/default";
import StatProfile from "@/components/profileStat";
import profileStats from "@/data/profileStats.json";
import "@/styles/profile.css";

export default function ProfilePage() {
    const { user, isLoading, isAuthenticated } = useAuth0();
    const navigate = useNavigate();

    // Redirection si pas authentifié
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate("/login");
        }
    }, [isLoading, isAuthenticated, navigate]);

    if (isLoading) {
        return (
            <DefaultLayout>
                <div className="profile-page">
                    <p>Chargement du profil...</p>
                </div>
            </DefaultLayout>
        );
    }

    if (!user) return null;

    return (
        <DefaultLayout>
            <div className="profile-page">
                {/* Partie profile, au dessus des cartes stats */}
                <div className="profile-header">
                    <img
                        src={user.picture || "/src/images/equipe/avatar.png"}
                        // alt={user.name}
                        className="profile-photo"
                    />
                    
                    <div className="profile-info">
                        <h1 className="profile-name">{user.name || "Utilisateur"}</h1>
                        <p className="profile-location">Loooooc</p>
                        <div className="profile-description-section">
                            <h2 className="profile-description-title">Description :</h2>
                            <p className="profile-description-text">Descriptiooooon profil</p>
                        </div>
                    </div>
                </div>

                {/* Grille de stats */}
                <div className="stats-grid">
                    {profileStats.map((card, i) => (<StatProfile key={i} {...card} />))}
                </div>
            </div>
        </DefaultLayout>
    );
}