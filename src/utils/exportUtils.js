import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// 1. Export JSON to Excel (.xlsx) with auto column widths
export const exportToExcel = (data, filename = "backup") => {
  if (!data || !Array.isArray(data) || data.length === 0) return false;
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Calculate and set column widths dynamically
  const headers = Object.keys(data[0]);
  const colWidths = headers.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(data.length, 100); i++) {
      const val = data[i][key];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Backup Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
  return true;
};

// 2. Export JSON to CSV (.csv) with UTF-8 BOM and formula injection protection
export const exportToCSV = (data, filename = "backup") => {
  if (!data || !Array.isArray(data) || data.length === 0) return false;
  
  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        let val = item[header] !== undefined && item[header] !== null ? String(item[header]) : "";
        // Neutralize spreadsheet formula injection characters (=, +, -, @)
        if (/^[=+\-@\t\r]/.test(val)) {
          val = "'" + val;
        }
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
  return true;
};

// 3. Export JSON to Landscape Table PDF (.pdf)
export const exportToPDF = (data, title = "Data Backup", filename = "backup") => {
  if (!data || !Array.isArray(data) || data.length === 0) return false;
  
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(title, 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${data.length}`, 14, 22);

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((h) => (item[h] !== undefined && item[h] !== null ? String(item[h]) : "-"))
  );

  autoTable(doc, {
    startY: 26,
    head: [headers],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`${filename}.pdf`);
  return true;
};
