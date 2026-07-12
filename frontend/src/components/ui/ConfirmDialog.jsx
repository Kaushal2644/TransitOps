import Modal from "./Modal";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  danger = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-gray-400 text-sm mb-5">{message}</p>
    <div className="flex justify-end gap-2">
      <button
        onClick={onClose}
        className="text-sm px-4 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-[#161b22]"
      >
        Cancel
      </button>
      <button
        onClick={() => { onConfirm(); onClose(); }}
        className={`text-sm px-4 py-1.5 rounded text-white ${
          danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
