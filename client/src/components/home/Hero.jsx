import React from "react";
import { Search, LogIn, Info } from "lucide-react";
import DashboardPreview from "./DashboardPreview";

const Hero = () => {
  return (
    <section className="bg-primaryBlueLight/60">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
        {/* LEFT: COPY */}
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-primaryBlue sm:text-5xl">
            ELECTRONIC FILE TRACKING &amp; MANAGEMENT SYSTEM
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
            Digitizing government file management through secure registration,
            workflow automation, real-time tracking and transparent service
            delivery.
          </p>

          <button className="mt-3 bg-primaryBlue px-6 py-3 rounded-full text-sm text-white font-medium ">
            Track your File
          </button>
        </div>

        {/* RIGHT: DASHBOARD PREVIEW */}
        <div>
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
};

export default Hero;
