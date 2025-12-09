import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";

import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { useAuth0 } from "@auth0/auth0-react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import ProfileButton from "./profileButton";
import "@/styles/navbar.css";

export const Navbar = () => {
  const { loginWithRedirect, logout, user, isLoading } = useAuth0();

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="navbar-brand-link"
            color="foreground"
            href="/"
          >
            <img src="/src/images/logoSTL.png" alt="Logo" className="navbar-logo" />
            {/* <p className="font-bold text-inherit">MonSaintLaurent</p> */}
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="basis-3/5" justify="center">
        <div className="navbar-center-links">
          <NavbarItem>
            <Link
              className={clsx(linkStyles({ color: "foreground" }))}
              color="foreground"
              href="/"
            >
              Accueil
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              className={clsx(linkStyles({ color: "foreground" }))}
              color="foreground"
              href="/about"
            >
              À propos de nous
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              className={clsx(linkStyles({ color: "foreground" }))}
              color="foreground"
              href="/projets"
            >
              Projets
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              className={clsx(linkStyles({ color: "foreground" }))}
              color="foreground"
              href="/jeux"
            >
              Jeux
            </Link>
          </NavbarItem>
        </div>
      </NavbarContent>

      <NavbarContent className="basis-1/5" justify="end">
        <ThemeSwitch />
        {isLoading ? (
          <Button isLoading color="primary" variant="flat">
            Loading...
          </Button>
        ) : user ? (
          <ProfileButton />
        ) : (
          <Button
            color="primary"
            variant="flat"
            onPress={() => {
              loginWithRedirect();
            }}
          >
            Se connecter
          </Button>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu className="sm:hidden">
        <NavbarMenuItem>
          <div className="navbar-mobile-menu">
            <Link color="foreground" href="/">Accueil</Link>
            <Link color="foreground" href="/about">À propos de nous</Link>
            <Link color="foreground" href="/projets">Projets</Link>
            <Link color="foreground" href="/jeux">Jeux</Link>
          </div>
        </NavbarMenuItem>
      </NavbarMenu>
    </HeroUINavbar>
  );
};