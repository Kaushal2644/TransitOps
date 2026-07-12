const COLORS = {
  Available: "bg-green-600",
  "On Trip": "bg-blue-600",
  "In Shop": "bg-amber-600",
  Retired: "bg-red-600",
  "Off Duty": "bg-gray-600",
  Suspended: "bg-orange-600",
  Draft: "bg-blue-500",
  Dispatched: "bg-blue-600",
  Completed: "bg-green-600",
  Cancelled: "bg-red-600",
  Active: "bg-amber-600",
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-1 rounded text-xs text-white font-medium ${COLORS[status] || "bg-gray-600"}`}
  >
    {status}
  </span>
);

export default StatusBadge;