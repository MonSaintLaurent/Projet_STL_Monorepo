import { Route, Routes } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef } from "react";

import LoadingPage from "./pages/loading";
import ErrorPage from "./pages/error";

// Links entre pages et routage plus bas
import IndexPage from "@/pages/index";
import AboutPage from "@/pages/about";
import ProjectsPage from "@/pages/projects";
import DefisPage from "@/pages/defis";
import LoginPage from "@/pages/login";
import ProfilePage from "@/pages/profile";
import FindValuedefi from "./pages/defis/findValue";
import Depolluedefi from "./pages/defis/depollue";

function App() {
  const {isLoading, error, isAuthenticated, user, getAccessTokenSilently} = useAuth0();
  const hasSynced = useRef(false);

  // Synchronisation avec le backend
  useEffect(() => {
    const syncUser = async () => {
      if (!user || hasSynced.current) return;
      hasSynced.current = true;

      try {
        const token = await getAccessTokenSilently({
          audience: "https://api.monstl.local",
          scope: "openid profile email",
        } as any);

        // Envoyer l'ID token au backend
        const res = await fetch("http://localhost:8000/auth/sync_user", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        console.log("Réponse backend:", data);
      } catch (err) {
        console.error("Erreur sync user:", err);
        hasSynced.current = false;
      }
    };

    syncUser();
  }, [user, getAccessTokenSilently]);

  if (error) {
    return <ErrorPage />;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<AboutPage />} path="/about" />
      <Route element={<ProjectsPage />} path="/projets" />
      <Route element={<DefisPage />} path="/defis" />
      <Route element={<FindValuedefi />} path="/defis/findValue" />
      <Route element={<Depolluedefi />} path="/defis/depollue" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProfilePage />} path="/profile" />
      <Route element={<LoadingPage />} path="/callback" />
    </Routes>
  );
}

export default App;
