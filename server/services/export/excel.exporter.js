import ExcelJS from "exceljs";

/** { title, columns: [{key,label}], rows: [{...}] } -> .xlsx Buffer, one sheet, bold header row. */
export const buildExcel = async ({ title, columns, rows }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EFTMS";
  workbook.created = new Date();

  // Excel sheet names cap at 31 characters and reject a handful of symbols.
  const sheet = workbook.addWorksheet((title || "Report").slice(0, 31).replace(/[[\]*/\\?:]/g, " "));
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(c.label.length + 2, 15) }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  return workbook.xlsx.writeBuffer();
};
