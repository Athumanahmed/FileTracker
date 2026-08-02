import { ShieldCheck, Lock } from "lucide-react";

/**
 * Left-hand role picker for the Role Permissions matrix -- one role
 * selected at a time, same "selected" visual treatment (primaryBlue
 * border/background) as ActorTypeSelector uses for actor types.
 */
const RoleSelectorList = ({ roles, isLoading, selectedRoleId, onSelect }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
      {roles.map((role) => {
        const isSelected = role.id === selectedRoleId;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            className={`flex items-center gap-3 shrink-0 lg:shrink w-64 lg:w-full text-left rounded-xl border px-3.5 py-3 transition-all ${
              isSelected
                ? "border-primaryBlue bg-primaryBlueLight/60 ring-1 ring-primaryBlue/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isSelected ? "bg-primaryBlue text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {role.isSystem ? <Lock size={15} /> : <ShieldCheck size={15} />}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${isSelected ? "text-primaryBlue" : "text-gray-800"}`}>
                {role.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{role.code}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RoleSelectorList;
