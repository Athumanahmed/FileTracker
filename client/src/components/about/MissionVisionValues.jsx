import React from "react";
import { Target, Eye, Gem, CheckCircle2 } from "lucide-react";

const values = [
  "Integrity",
  "Accountability",
  "Transparency",
  "Innovation",
  "Service Excellence",
];

const MissionVisionValues = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MISSION */}
        <div className="rounded-2xl bg-primaryBlueLight p-7">
          <div className="flex size-11 items-center justify-center rounded-full bg-white text-primaryBlue shadow-sm">
            <Target className="size-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-primaryBlue">Our Mission</h3>
          <span className="mt-2 block h-1 w-10 rounded-full bg-goldAccent" />
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            To provide a secure, efficient and transparent electronic file
            management system that enhances service delivery and promotes
            good governance.
          </p>
        </div>

        {/* VISION */}
        <div className="rounded-2xl bg-green-50 p-7">
          <div className="flex size-11 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
            <Eye className="size-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-green-700">Our Vision</h3>
          <span className="mt-2 block h-1 w-10 rounded-full bg-goldAccent" />
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            To be a leading municipal council in digital transformation by
            leveraging technology for effective records management and public
            service excellence.
          </p>
        </div>

        {/* VALUES */}
        <div className="rounded-2xl bg-amber-50 p-7">
          <div className="flex size-11 items-center justify-center rounded-full bg-white text-goldAccent shadow-sm">
            <Gem className="size-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-amber-600">Our Values</h3>
          <span className="mt-2 block h-1 w-10 rounded-full bg-goldAccent" />
          <ul className="mt-4 space-y-2">
            {values.map((value) => (
              <li key={value} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="size-4 shrink-0 text-goldAccent" />
                {value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default MissionVisionValues;
