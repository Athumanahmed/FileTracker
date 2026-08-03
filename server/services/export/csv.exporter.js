const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/** { columns: [{key,label}], rows: [{...}] } -> CSV text. No dependency needed -- CSV is simple enough to hand-generate correctly. */
export const buildCsv = ({ columns, rows }) => {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(","));
  return [header, ...lines].join("\n");
};
