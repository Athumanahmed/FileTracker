import PDFDocument from "pdfkit";

const ROW_HEIGHT = 20;

/** { title, columns: [{key,label}], rows: [{...}] } -> PDF Buffer. A plain paginated table, government-report style, not a rendered chart image. */
export const buildPdf = ({ title, columns, rows }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#555555").text(`Generated: ${new Date().toISOString()}`, { align: "center" });
    doc.fillColor("#000000");
    doc.moveDown(1);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / columns.length;

    const drawRow = (values, y, isHeader) => {
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(8);
      values.forEach((value, i) => {
        doc.text(String(value ?? ""), doc.page.margins.left + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
      });
    };

    let y = doc.y;
    drawRow(columns.map((c) => c.label), y, true);
    y += ROW_HEIGHT;
    doc
      .moveTo(doc.page.margins.left, y - 4)
      .lineTo(doc.page.width - doc.page.margins.right, y - 4)
      .stroke();

    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - ROW_HEIGHT) {
        doc.addPage();
        y = doc.page.margins.top;
        drawRow(columns.map((c) => c.label), y, true);
        y += ROW_HEIGHT;
      }
      drawRow(columns.map((c) => row[c.key]), y, false);
      y += ROW_HEIGHT;
    }

    doc.end();
  });
