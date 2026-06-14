import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

/**
 * Export data to Excel (.xlsx)
 */
export const exportToExcel = (data, filename, sheetName = "Data") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns (basic)
  const colWidths = Object.keys(data[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length),
    ),
  }));
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export data to Word (.docx) as a formatted table
 */
export const exportToWord = async (data, filename, title = "Report") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);

  // Create header row
  const headerRow = new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [
            new Paragraph({
              text: header,
              bold: true,
              size: 20,
            }),
          ],
          shading: { fill: "F3F4F6" },
          width: {
            value: Math.floor(9000 / headers.length),
            type: WidthType.DXA,
          },
        }),
    ),
  });

  // Create data rows
  const dataRows = data.map(
    (row) =>
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  text: String(row[header] ?? ""),
                  size: 18,
                }),
              ],
              width: {
                value: Math.floor(9000 / headers.length),
                type: WidthType.DXA,
              },
            }),
        ),
      }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleString()}`,
            spacing: { after: 300 },
          }),
          new Table({
            rows: [headerRow, ...dataRows],
            width: { value: 9000, type: WidthType.DXA },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  saveAs(blob, `${filename}.docx`);
};

/**
 * Export data to CSV (kept for backward compatibility)
 */
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((field) => {
          const value = row[field] ?? "";
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
