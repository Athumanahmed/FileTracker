import React from "react";
import { Shield, Clock, TrendingUp, Users } from "lucide-react";

const highlights = [
  { icon: Shield, label: "Secure & Reliable" },
  { icon: Clock, label: "Real-time Tracking" },
  { icon: TrendingUp, label: "Improved Efficiency" },
  { icon: Users, label: "Transparency & Accountability" },
];

const AboutHero = () => {
  return (
    <section className="bg-primaryBlueLight/60">
      <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-20">
        <p className="text-sm font-bold tracking-wide text-primaryBlue">
          ABOUT EFTMS
        </p>
        <span className="mx-auto mt-2 block h-1 w-16 rounded-full bg-goldAccent" />

        <h1 className="mt-5 text-4xl font-extrabold leading-tight text-primaryBlue sm:text-5xl">
          Transforming Government File Management
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
          The Electronic File Tracking and Management System (EFTMS) is an
          innovative solution designed to digitize and streamline the way
          government files are registered, tracked, processed and archived.
        </p>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-y-8 border-t border-gray-200 pt-8 sm:grid-cols-4">
          {highlights.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 px-2">
              <div className="flex size-11 items-center justify-center rounded-full bg-white text-primaryBlue shadow-sm">
                <Icon className="size-5" />
              </div>
              <p className="text-xs font-medium leading-snug text-gray-700">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
