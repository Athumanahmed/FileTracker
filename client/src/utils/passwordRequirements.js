
export const PASSWORD_REQUIREMENTS = [
  {
    key: "length",
    label: "At least 8 characters long",
    test: (v) => v.length >= 8,
  },
  {
    key: "uppercase",
    label: "At least one uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    key: "lowercase",
    label: "At least one lowercase letter",
    test: (v) => /[a-z]/.test(v),
  },
  { key: "number", label: "At least one number", test: (v) => /[0-9]/.test(v) },
  {
    key: "special",
    label: "At least one special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export const getPasswordStrength = (password) => {
  if (!password) return null;
  const metCount = PASSWORD_REQUIREMENTS.filter((req) =>
    req.test(password),
  ).length;

  if (metCount <= 2)
    return {
      label: "Weak",
      labelClass: "text-red-500",
      barClass: "bg-red-500",
      bars: 1,
    };
  if (metCount === 3)
    return {
      label: "Fair",
      labelClass: "text-orange-500",
      barClass: "bg-orange-500",
      bars: 2,
    };
  if (metCount === 4)
    return {
      label: "Good",
      labelClass: "text-yellow-600",
      barClass: "bg-yellow-500",
      bars: 3,
    };
  return {
    label: "Strong",
    labelClass: "text-green-600",
    barClass: "bg-green-500",
    bars: 4,
  };
};
