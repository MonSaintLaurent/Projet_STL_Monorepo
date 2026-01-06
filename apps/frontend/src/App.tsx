import { Route, Routes } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import LoadingPage from "./pages/loading";
import ErrorPage from "./pages/error";

// Links entre pages et routage plus bas
import IndexPage from "@/pages/index";
import AboutPage from "@/pages/about";
import ProjectsPage from "@/pages/projects";
import GamesPage from "@/pages/games";
import LoginPage from "@/pages/login";
import ProfilePage from "@/pages/profile";
import FindValueGame from "./pages/games/findValue";
import DepollueGame from "./pages/games/depollue";

function App() {
  const { isLoading, error } = useAuth0();

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
      <Route element={<GamesPage />} path="/jeux" />
      <Route element={<FindValueGame />} path="/jeux/findValue" />
      <Route element={<DepollueGame />} path="/jeux/depollue" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProfilePage />} path="/profile" />
      <Route element={<LoadingPage />} path="/callback" />
    </Routes>
  );
}

export default App;
