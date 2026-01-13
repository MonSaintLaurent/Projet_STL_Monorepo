import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import "@/styles/login.css";

export default function LoginPage() {
  const {loginWithRedirect} = useAuth0();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auth0 gère l'authentification, on redirige vers Auth0
    loginWithRedirect({
      authorizationParams: {
        audience: "https://api.monstl.local",
        scope: "openid profile email",
      },
    });
  };

  return (
    <DefaultLayout>
      <div className="login-page">
        <div className="login-container">
          <h1 className="login-title">Se connecter</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Adresse email
              </label>
              <input type="email" id="email" className="form-input" placeholder="Richard.martin@yourmail.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Mot de passe</label>
              <input type="password" id="password" className="form-input" placeholder="••••••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>

            <Button type="submit" color="primary" size="lg" className="w-full font-bold">Se connecter</Button>
          </form>

          <div className="divider">OU</div>

          <div className="social-buttons">
            <Button color="primary" variant="flat" size="lg" className="w-full" onPress={() => loginWithRedirect({
              authorizationParams: {scope: "openid profile email"},
            })}>🌐 Google</Button>
            <Button color="secondary" variant="flat" size="lg" className="w-full" onPress={() => loginWithRedirect({
              authorizationParams: {scope: "openid profile email"},
            })}>🔐 Avec votre SSO</Button>
          </div>

          <div className="signup-section">
            <p className="signup-text">Vous n'avez pas de compte ?</p>
            <Button color="primary" variant="light" size="md" className="w-full" onPress={() => loginWithRedirect({
              authorizationParams: {scope: "openid profile email"},
            })}>Inscrivez-vous</Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
