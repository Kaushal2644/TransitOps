import { Download, FileText } from "lucide-react";

const ExportButtons = ({ onExportCsv, onExportPdf, disabled = false }) => (
  <div className="flex gap-2">
    <button
      disabled={disabled}
      onClick={onExportCsv}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-[#161b22] disabled:opacity-40"
    >
      <Download size={14} />
      CSV
    </button>
    <button
      disabled={disabled}
      onClick={onExportPdf}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-[#161b22] disabled:opacity-40"
    >
      <FileText size={14} />
      PDF
    </button>
  </div>
);

export default ExportButtons;
