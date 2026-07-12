import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToPdf = (title, rows, columns, filename) => {
  if (!rows?.length) return false;

  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => c.accessor(row))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6] },
  });

  doc.save(`${filename}.pdf`);
  return true;
};

export const exportAnalyticsPdf = (title, kpis, tables, filename) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(10);

  let y = 24;
  kpis.forEach(({ label, value }) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 6;
  });

  tables.forEach(({ heading, columns, rows }) => {
    y += 6;
    doc.setFontSize(11);
    doc.text(heading, 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [columns.map((c) => c.header)],
      body: rows.map((row) => columns.map((c) => c.accessor(row))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 119, 6] },
    });
    y = doc.lastAutoTable.finalY + 10;
  });

  doc.save(`${filename}.pdf`);
  return true;
};
