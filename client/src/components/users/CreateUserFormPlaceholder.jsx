import { Construction, MousePointerClick } from "lucide-react";

/** Shown once an actor type is picked -- stands in for the real per-role creation form, not built yet. */
export const CreateUserFormPlaceholder = ({ actor }) => {
  const Icon = actor.icon;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8 h-full flex flex-col items-center justify-center text-center min-h-[360px]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primaryBlueLight text-primaryBlue mb-4">
        <Icon size={26} />
      </span>
      <h2 className="text-lg font-bold text-gray-900">
        {actor.label} Registration
      </h2>
      <p className="text-sm text-gray-500 mt-1.5 max-w-sm">
        The form to create a new {actor.label.toLowerCase()} account is being
        designed and will appear here.
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <Construction size={13} />
        Coming soon
      </span>
    </div>
  );
};

/** Shown before any actor type has been picked. */
export const NoActorSelected = () => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 sm:p-8 h-full flex flex-col items-center justify-center text-center min-h-[360px]">
    <MousePointerClick className="text-gray-300" size={32} />
    <p className="text-sm font-medium text-gray-600 mt-3">Select a user type</p>
    <p className="text-xs text-gray-400 mt-1 max-w-xs">
      Choose a role from the panel to begin creating that account.
    </p>
  </div>
);
