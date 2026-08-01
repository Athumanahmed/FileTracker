import { Inbox, Plus } from "lucide-react";

const EmptyState = ({
  title,
  message,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="mt-10 flex flex-col items-center justify-center text-center py-16 px-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      <Icon className="w-10 h-10 text-gray-400" />

      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center mt-5 px-4 py-2.5 bg-primaryBlue text-white text-sm rounded-full hover:opacity-90 transition"
        >
          <Plus className="size-4.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
