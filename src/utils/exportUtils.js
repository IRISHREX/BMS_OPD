import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// 1. Export JSON to Excel (.xlsx)
export const exportToExcel = (data, filename = "backup") => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Backup Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// 2. Export JSON to CSV (.csv) with UTF-8 BOM
export const exportToCSV = (data, filename = "backup") => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const val = item[header] !== undefined && item[header] !== null ? String(item[header]) : "";
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  // Prepend \uFEFF for proper UTF-8 handling in MS Excel
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 3. Export JSON to Landscape Table PDF (.pdf)
export const exportToPDF = (data, title = "Data Backup", filename = "backup") => {
  if (!data || data.length === 0) return;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(title, 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${data.length}`, 14, 22);

  const headers = Object.keys(data[0]);
  const rows = data.map((item) => headers.map((h) => item[h] !== undefined ? String(item[h]) : "-"));

  autoTable(doc, {
    startY: 26,
    head: [headers],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`${filename}.pdf`);
};
