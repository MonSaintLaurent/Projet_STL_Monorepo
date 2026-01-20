import {useAuth0} from "@auth0/auth0-react";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import DefaultLayout from "@/layouts/default";
import StatProfile from "@/components/profileStat";
import "@/styles/profile.css";

function formatPlayTime(seconds: number) {
  if (seconds < 60) return `${seconds} sec`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ProfilePage() {
  const {user, isLoading, isAuthenticated, logout, getAccessTokenSilently} = useAuth0();
  const navigate = useNavigate();

  //  State édition et inputs
  const [editing, setEditing] = useState<{ country: boolean; description: boolean }>({ country: false, description: false });
  const [profile, setProfile] = useState<{ country: string; description: string }>({ country: "", description: "" });
  const [countryInput, setCountryInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");

  //  Stats backend
  const [stats, setStats] = useState<{
    total_score: number;
    total_sessions: number;
    defis_played: number;
    max_score_ever: number;
    total_play_time: number;
  } | null>(null);

  // Redirection si pas authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Récupérer profil + stats backend
  useEffect(() => {
    async function fetchUserStats() {
      if (!isAuthenticated || !user) return;

      const token = await getAccessTokenSilently();

      const res = await fetch(
        `http://localhost:8000/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setProfile({
          country: data.user.country || "",
          description: data.user.description || "",
        });
        setCountryInput(data.user.country || "");
        setDescriptionInput(data.user.description || "");
        setStats(data.stats || null);
      } else {
        console.error("Erreur récupération profil :", res.status);
      }
    }

    fetchUserStats();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  async function saveCountry() {
    const token = await getAccessTokenSilently();
    const res = await fetch("http://localhost:8000/users/me", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country: countryInput }),
    });
    if (res.ok) {
      setEditing(prev => ({ ...prev, country: false }));
      setProfile(prev => ({ ...prev, country: countryInput }));
    }
  }

  async function saveDescription() {
    const token = await getAccessTokenSilently();
    const res = await fetch("http://localhost:8000/users/me", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description: descriptionInput }),
    });
    if (res.ok) {
      setEditing(prev => ({ ...prev, description: false }));
      setProfile(prev => ({ ...prev, description: descriptionInput }));
    }
  }

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
        <div className="profile-header">
          <img
            src={user.picture || "/src/images/equipe/avatar.png"}
            className="profile-photo"
          />
          <div className="profile-info">
            <h1 className="profile-name">{user.name || "Utilisateur"}</h1>

            <p className="profile-country">
            {editing.country ? (
              <div className="edit-box">
                <input
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="edit-input"
                  placeholder="Entrez votre pays"
                />
                <button onClick={saveCountry}>💾</button>
                <button onClick={() => setEditing(prev => ({ ...prev, country: false }))}>❌</button>
              </div>
            ) : (
              <>
                Pays: {profile.country || "Non renseigné"}{" "}
                <button onClick={() => setEditing(prev => ({ ...prev, country: true }))}>✏️</button>
              </>
            )}
          </p>

          <p className="profile-description-text">
            {editing.description ? (
              <div className="edit-box">
                <textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="edit-textarea"
                  placeholder="Écrivez une petite description..."
                />
                <button onClick={saveDescription}>💾</button>
                <button onClick={() => setEditing(prev => ({ ...prev, description: false }))}>❌</button>
              </div>
            ) : (
              <>
                {profile.description || "Pas de description"}{" "}
                <button onClick={() => setEditing(prev => ({ ...prev, description: true }))}>✏️</button>
              </>
            )}
          </p>

          </div>
        </div>

        <div className="stats-grid">
          {stats ? (
            <>
              <StatProfile title="Score total" value={stats.total_score.toString()} />
              <StatProfile title="Nombre de sessions" value={stats.total_sessions.toString()} />
              <StatProfile title="Défis joués" value={stats.defis_played.toString()} />
              <StatProfile title="Score max" value={stats.max_score_ever.toString()} />
              <StatProfile title="Temps total de jeu" value={stats ? formatPlayTime(stats.total_play_time) : "Chargement..."} />
            </>
          ) : (
            <p>Chargement des stats...</p>
          )}
        </div>

        <div
          style={{
            marginTop: 60,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() =>
              logout({
                logoutParams: {returnTo: window.location.origin + "/"},
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
      </div>
    </DefaultLayout>
  );
}
