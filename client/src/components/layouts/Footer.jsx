import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import { FaFacebookF, FaTwitter, FaYoutube, FaEnvelope } from "react-icons/fa";
import { imageAssets } from "../../assets/assets";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "About EFTMS", to: "/about" },
  { label: "Track File", href: "/#track-file" },
];

const resources = [
  { label: "News & Announcements", href: "/#news" },
  { label: "Privacy Policy", href: "/#privacy-policy" },
  { label: "Terms of Use", href: "/#terms-of-use" },
];

const socials = [
  { icon: FaFacebookF, label: "Facebook" },
  { icon: FaTwitter, label: "Twitter" },
  { icon: FaYoutube, label: "YouTube" },
  { icon: FaEnvelope, label: "Email" },
];

const Footer = () => {
  return (
    <footer className="bg-primaryBlue text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* ABOUT */}
        <div>
          <div className="flex items-center gap-3">
            <img
              src={imageAssets.Coat_Of_Arms}
              alt="Tabora Municipal Council coat of arms"
              className="h-10 w-10"
            />
            <p className="text-sm font-bold leading-tight">
              TABORA MUNICIPAL COUNCIL
            </p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/70">
            Electronic File Tracking &amp; Management System is an initiative by
            Tabora Municipal Council to improve efficiency, transparency and
            accountability in file management.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h4 className="text-xs font-bold tracking-wide text-white/90">
            QUICK LINKS
          </h4>
          <ul className="mt-4 space-y-2.5">
            {quickLinks.map((link) => (
              <li key={link.label}>
                {link.to ? (
                  <Link
                    to={link.to}
                    className="text-xs text-white/70 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="text-xs text-white/70 hover:text-white"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* RESOURCES */}
        <div>
          <h4 className="text-xs font-bold tracking-wide text-white/90">
            RESOURCES
          </h4>
          <ul className="mt-4 space-y-2.5">
            {resources.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-xs text-white/70 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="text-xs font-bold tracking-wide text-white/90">
            CONTACT US
          </h4>
          <ul className="mt-4 space-y-3 text-xs text-white/70">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              P.O. Box 124, Tabora, Tanzania
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0" />
              +255 26 232 1609
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0" />
              ict@tabora.go.tz
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-[11px] text-white/60">
        © 2024 Tabora Municipal Council. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
