import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  exportToExcel,
  exportToWord,
  exportToCSV,
} from "../../utils/exportUtils";

export default function ExportMenu({
  data,
  filename,
  title = "Report",
  className = "",
}) {
  const [open, setOpen] = useState(false);

  if (!data || data.length === 0) return null;

  const handleExport = (type) => {
    setOpen(false);

    if (type === "excel") {
      exportToExcel(data, filename, title);
    } else if (type === "word") {
      exportToWord(data, filename, title);
    } else if (type === "csv") {
      exportToCSV(data, filename);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
      >
        <Download size={15} />
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-sm">
            <button
              onClick={() => handleExport("excel")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={() => handleExport("word")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
            >
              <FileText size={16} className="text-blue-600" />
              <span>Export to Word</span>
            </button>
            <div className="border-t my-1" />
            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
            >
              <Download size={16} className="text-gray-500" />
              <span>Export to CSV</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
