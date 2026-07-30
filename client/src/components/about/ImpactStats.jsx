import React from "react";
import { FileText, Users, Clock, TrendingUp, ShieldCheck } from "lucide-react";

const stats = [
  {
    icon: FileText,
    value: "1,248+",
    label: "Files Registered",
    sub: "Since Inception",
    tone: "text-primaryBlue bg-primaryBlueLight",
  },
  {
    icon: Users,
    value: "8+",
    label: "Departments",
    sub: "Connected",
    tone: "text-green-600 bg-green-50",
  },
  {
    icon: Clock,
    value: "4.2 Days",
    label: "Avg. Processing Time",
    sub: "Improved Efficiency",
    tone: "text-amber-600 bg-amber-50",
  },
  {
    icon: TrendingUp,
    value: "95%",
    label: "Tracking Accuracy",
    sub: "Real-time Updates",
    tone: "text-primaryBlue bg-primaryBlueLight",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Secure & Compliant",
    sub: "Data Protection",
    tone: "text-green-600 bg-green-50",
  },
];

const ImpactStats = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-bold tracking-wide text-primaryBlue">
          EFTMS IMPACT
        </h2>
        <span className="mt-2 block h-1 w-10 rounded-full bg-goldAccent" />

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(({ icon: Icon, value, label, sub, tone }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 px-4 py-6 text-center"
            >
              <div className={`flex size-11 items-center justify-center rounded-full ${tone}`}>
                <Icon className="size-5" />
              </div>
              <p className="text-xl font-extrabold text-primaryBlue">{value}</p>
              <div>
                <p className="text-xs font-medium text-gray-700">{label}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;
