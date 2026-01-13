import {useAuth0} from "@auth0/auth0-react";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";
import DefaultLayout from "@/layouts/default";
import StatProfile from "@/components/profileStat";
import profileStats from "@/data/profileStats.json";
import "@/styles/profile.css";

export default function ProfilePage() {
  const {user, isLoading, isAuthenticated , logout} = useAuth0();
  const navigate = useNavigate();

  // Redirection si pas authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);


  if (isLoading || !user) {
    return (
      <DefaultLayout>
        <div className="profile-page">
          <p>Chargement du profil...</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="profile-page">
        <div className="profile-header-container">
          <button
            onClick={() =>
              logout({
                logoutParams: { returnTo: window.location.origin + "/login" },
              })
            }
            className="logout-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Se déconnecter
          </button>
        </div>

        <div className="profile-header">
          <img
            src={user.picture || "/src/images/equipe/avatar.png"}
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

        <div className="stats-grid">
          {profileStats.map((card, i) => (
            <StatProfile key={i} {...card} />
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
}
