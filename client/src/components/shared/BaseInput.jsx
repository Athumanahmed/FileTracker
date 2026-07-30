import React from "react";
import { ChevronDown } from "lucide-react";

const BaseInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
  error = "",
  helperText = "",
  className = "",
  inputClassName = "",
  labelClassName = "",
  leftIcon,
  rightIcon,
  as = "input", // "input" | "textarea" | "select"
  rows = 3,
  options = [], // for select
  ...rest
}) => {
  const base =
    "w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-150 bg-white " +
    "placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

  const state = error
    ? "border-red-300 bg-red-50/30 focus:ring-2 focus:ring-red-200 focus:border-red-400"
    : "border-gray-300 focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue";

  const handleChange = (e) => {
    if (!onChange) return;
    const val =
      e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    onChange(name, val);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* LABEL */}
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 mb-1.5 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* INPUT WRAPPER */}
      <div className="relative flex items-center">
        {/* LEFT ICON */}
        {leftIcon && (
          <div className="absolute left-3 text-gray-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        {/* FIELD TYPES */}
        {as === "textarea" ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`${base} ${state} resize-none ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-9" : ""} ${inputClassName}`}
            {...rest}
          />
        ) : as === "select" ? (
          <>
            <select
              id={name}
              name={name}
              value={value ?? ""}
              onChange={handleChange}
              disabled={disabled}
              className={`${base} ${state} appearance-none ${leftIcon ? "pl-9" : ""} pr-9 ${inputClassName}`}
              {...rest}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 text-gray-400 pointer-events-none">
              <ChevronDown size={15} />
            </div>
          </>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`${base} ${state} ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-9" : ""} ${inputClassName}`}
            {...rest}
          />
        )}

        {/* RIGHT ICON (non-select only) */}
        {rightIcon && as !== "select" && (
          <div className="absolute right-3 text-gray-400 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {/* ERROR / HELPER */}
      {error ? (
        <p className="text-xs text-red-500 mt-1.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-400 mt-1.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default BaseInput;
