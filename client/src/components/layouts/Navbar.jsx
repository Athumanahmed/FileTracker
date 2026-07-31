import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Globe, LogIn, Menu, X } from "lucide-react";
import { imageAssets } from "../../assets/assets";
import useAuthStore from "../../store/authStore";
import UserMenu from "../shared/UserMenu";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About EFTMS", to: "/about" },
  { label: "Track File", href: "/#track-file" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const loadingUser = useAuthStore((state) => state.loadingUser);

  const isActive = (link) => Boolean(link.to) && pathname === link.to;

  return (
    <header className="sticky top-0 z-50 w-full bg-primaryBlue text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* BRAND */}
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src={imageAssets.Coat_Of_Arms}
            alt="Tabora Municipal Council coat of arms"
            className="h-9 w-9 shrink-0 sm:h-11 sm:w-11"
          />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold tracking-wide">
              TABORA MUNICIPAL COUNCIL
            </p>
          </div>
        </Link>

        {/* NAV LINKS */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(link);
            const className = `relative py-1 text-sm font-medium whitespace-nowrap transition-colors ${
              active ? "text-white" : "text-white/75 hover:text-white"
            }`;
            const underline = active && (
              <span className="absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-goldAccent" />
            );

            return link.to ? (
              <Link key={link.label} to={link.to} className={className}>
                {link.label}
                {underline}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className={className}>
                {link.label}
                {underline}
              </a>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="hidden items-center gap-1 text-sm text-white/85 hover:text-white md:flex">
            <Globe className="size-4" />
            English
            <ChevronDown className="size-3.5" />
          </button>

          {loadingUser ? (
            <span className="h-9 w-9 animate-pulse rounded-full bg-white/15" />
          ) : user ? (
            <UserMenu />
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-primaryBlue md:flex"
            >
              <LogIn className="size-4" />
              Login
            </Link>
          )}

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <nav className="border-t border-white/10 bg-primaryBlue lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2 sm:px-6">
            {navLinks.map((link) => {
              const active = isActive(link);
              const className = `border-b border-white/10 py-3 text-sm font-medium last:border-none ${
                active ? "text-goldAccent" : "text-white/80"
              }`;

              return link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={className}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={className}
                >
                  {link.label}
                </a>
              );
            })}

            {/* Signed-in identity/logout is handled by the always-visible
                UserMenu next to the hamburger button; only the logged-out
                Login CTA needs a mobile-only home here. */}
            {!loadingUser && !user && (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="my-3 flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-sm font-semibold text-primaryBlue"
              >
                <LogIn className="size-4" />
                Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
