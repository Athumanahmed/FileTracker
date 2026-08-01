import { useRef } from "react";

const OtpInput = ({
  length = 6,
  value,
  onChange,
  disabled,
  error,
  autoFocus = true,
}) => {
  const inputRefs = useRef([]);
  const digits = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length);

  const focusBox = (index) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const setDigitAt = (index, digit) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigitAt(index, "");
      return;
    }
    const chars = raw.split("");
    let cursor = index;
    const next = digits.slice();
    for (const char of chars) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    onChange(next.join("").slice(0, length));
    focusBox(Math.min(cursor, length - 1));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigitAt(index, "");
        return;
      }
      if (index > 0) {
        e.preventDefault();
        setDigitAt(index - 1, "");
        focusBox(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index, e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = digits.slice();
    let cursor = index;
    for (const char of pasted.split("")) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    onChange(next.join("").slice(0, length));
    focusBox(Math.min(cursor, length - 1));
  };

  return (
    <div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`h-12 w-10 sm:h-14 sm:w-12 rounded-xl border text-center text-lg font-semibold outline-none transition-all duration-150 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
              error
                ? "border-red-300 bg-red-50/30 focus:ring-2 focus:ring-red-200 focus:border-red-400"
                : "border-gray-300 focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue"
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
};

export default OtpInput;
