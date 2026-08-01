import { ChevronRight, ShieldOff } from "lucide-react";

const SCOPE_TONES = {
  Global: "bg-blue-50 text-blue-600",
  Department: "bg-purple-50 text-purple-600",
  Unit: "bg-teal-50 text-teal-600",
};

/**
 * Left-panel actor picker -- `actors` is already filtered to what the
 * caller can actually create (see getCreatableActorTypes), so this
 * component never makes its own privilege decisions, only renders them.
 */
const ActorTypeSelector = ({ actors, selectedRoleCode, onSelect }) => (
  <div className="h-full rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
    <div className="p-5 border-b border-gray-100">
      <h2 className="font-semibold text-gray-900">User Types</h2>
      <p className="text-xs text-gray-500 mt-1">
        Based on your account&apos;s creation privileges
      </p>
    </div>

    {actors.length === 0 ? (
      <div className="p-6 text-center">
        <ShieldOff className="mx-auto text-gray-300" size={28} />
        <p className="text-sm text-gray-500 mt-3">
          You don&apos;t have permission to create any user type.
        </p>
      </div>
    ) : (
      <div className="p-2 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto">
        {actors.map((actor) => {
          const isActive = actor.roleCode === selectedRoleCode;
          const Icon = actor.icon;

          return (
            <button
              key={actor.roleCode}
              type="button"
              onClick={() => onSelect(actor)}
              aria-pressed={isActive}
              className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 mb-1 last:mb-0 ${
                isActive
                  ? "bg-primaryBlueLight border border-primaryBlue/30"
                  : "border border-transparent hover:bg-gray-50"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? "bg-primaryBlue text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold truncate ${isActive ? "text-primaryBlue" : "text-gray-800"}`}
                  >
                    {actor.label}
                  </p>
                  <ChevronRight
                    size={15}
                    className={`shrink-0 ${isActive ? "text-primaryBlue" : "text-gray-300"}`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {actor.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export default ActorTypeSelector;
