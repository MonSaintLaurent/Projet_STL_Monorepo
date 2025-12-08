import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      cacheLocation="localstorage"
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      useRefreshTokens={true}
    >
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        {children}
      </HeroUIProvider>
    </Auth0Provider>
  );
}
