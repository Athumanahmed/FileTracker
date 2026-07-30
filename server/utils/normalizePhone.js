export const normalizePhoneTZ = (phone) => {
  if (phone.startsWith("0")) return "255" + phone.slice(1);
  if (phone.startsWith("+")) return phone.slice(1);
  if (phone.startsWith("255")) return phone;
  return null;
};
