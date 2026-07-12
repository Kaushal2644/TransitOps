import { X } from "lucide-react";

const Modal = ({ open, onClose, title, children, size = "md" }) => {
  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} bg-[#12161c] border border-gray-800 rounded-lg shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-white text-sm font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
