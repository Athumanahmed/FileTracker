import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

const BADGE_TONES = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-primaryBlueLight text-primaryBlue",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
};

const BUTTON_VARIANTS = {
  primary:
    "bg-primaryBlue text-white hover:bg-primaryBlueDark disabled:hover:bg-primaryBlue",
  secondary:
    "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:hover:bg-white",
  danger:
    "border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:hover:bg-white",
};

/** Renders as a Link (to), an anchor (href), or a button (onClick) -- whichever the caller supplies. */
const ActionButton = ({
  label,
  icon: Icon,
  to,
  href,
  onClick,
  variant = "secondary",
  disabled = false,
  loading = false,
}) => {
  const className = `inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.secondary}`;

  const content = (
    <>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} />
      )}
      {label}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  if (href && !disabled && !loading) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {content}
    </button>
  );
};

const Skeleton = () => (
  <div className="flex flex-col gap-2.5 animate-pulse">
    <div className="h-6 w-48 rounded bg-gray-200" />
    <div className="h-4 w-72 rounded bg-gray-100" />
  </div>
);

/**
 * Enterprise-style page header -- breadcrumbs, optional back button, an
 * icon badge, title + description, an optional status badge next to the
 * title, and a right-aligned action area (primary + secondary buttons, or
 * a fully custom `actions` node when buttons alone aren't enough). `children`
 * renders below the title row and above the divider, for tabs/filters that
 * conceptually belong to the header.
 *
 * Meant to be the one header every dashboard page reaches for -- new pages
 * should use this rather than hand-rolling their own <h1>/description block.
 */
const PageHeader = ({
  title,
  description,
  icon: Icon,
  badge, // { label, tone: "gray" | "blue" | "green" | "amber" | "red" }
  breadcrumbs, // [{ label, to? }] -- last item is treated as the current page
  backTo,
  primaryAction, // { label, icon, to?, href?, onClick?, disabled?, loading? }
  secondaryActions = [], // same shape as primaryAction, rendered with the secondary style unless variant is set
  actions, // arbitrary ReactNode, rendered between secondaryActions and primaryAction
  loading = false,
  divider = true,
  className = "",
  children,
}) => {
  const hasActions = Boolean(
    primaryAction || secondaryActions.length || actions,
  );

  return (
    <div
      className={`${divider ? "border-b border-gray-100 pb-5 mb-6" : ""} ${className}`}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-1 mb-2 text-xs text-gray-500"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span
                key={`${crumb.label}-${index}`}
                className="flex items-center gap-1"
              >
                {index > 0 && (
                  <ChevronRight size={12} className="text-gray-300" />
                )}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-primaryBlue transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-medium text-gray-700" : ""}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {backTo && (
            <Link
              to={backTo}
              aria-label="Go back"
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </Link>
          )}

          {Icon && (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
              <Icon size={18} />
            </span>
          )}

          {loading ? (
            <Skeleton />
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {title}
                </h1>
                {badge && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[badge.tone] || BADGE_TONES.gray}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
        </div>

        {hasActions && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {secondaryActions.map((action, index) => (
              <ActionButton
                key={`${action.label}-${index}`}
                variant="secondary"
                {...action}
              />
            ))}
            {actions}
            {primaryAction && (
              <ActionButton variant="primary" {...primaryAction} />
            )}
          </div>
        )}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
};

export default PageHeader;
