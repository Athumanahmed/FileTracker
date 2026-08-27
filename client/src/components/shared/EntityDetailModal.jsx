import Modal from "./Modal";

const StatusPill = ({ isActive }) =>
  isActive ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Inactive
    </span>
  );

/**
 * Read-only "View Details" modal for the organizational catalog entities
 * (Department, Unit, Role, Permission). Driven by a plain `fields` list --
 * `[{ label, value, mono? }]` -- so each module just describes what to show
 * rather than rebuilding the same definition-list layout. `value` can be a
 * string or any node; a nullish value renders as an em dash.
 */
const EntityDetailModal = ({ isOpen, onClose, title, description, icon, fields = [], isActive }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    description={description}
    icon={icon}
    size="lg"
    footer={
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Close
      </button>
    }
  >
    <dl className="divide-y divide-gray-100">
      {typeof isActive === "boolean" && (
        <div className="grid grid-cols-3 gap-4 py-3 first:pt-0">
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="col-span-2 text-sm text-gray-900">
            <StatusPill isActive={isActive} />
          </dd>
        </div>
      )}
      {fields.map(({ label, value, mono }) => (
        <div key={label} className="grid grid-cols-3 gap-4 py-3 first:pt-0">
          <dt className="text-sm font-medium text-gray-500">{label}</dt>
          <dd
            className={`col-span-2 text-sm text-gray-900 break-words ${mono ? "font-mono text-xs" : ""}`}
          >
            {value === null || value === undefined || value === "" ? (
              <span className="text-gray-400">—</span>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  </Modal>
);

export default EntityDetailModal;
