import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/ui/DataTable";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import ExportButtons from "../components/ui/ExportButtons";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination, { paginate } from "../components/ui/Pagination";
import { useSocketRefresh } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { formatCurrency } from "../utils/formatters";
import { exportToCsv } from "../utils/exportCsv";
import { exportToPdf } from "../utils/exportPdf";

const EXPORT_COLS = [
  { header: "Vehicle", accessor: (l) => l.vehicle?.registrationNumber },
  { header: "Service", accessor: (l) => l.serviceType },
  { header: "Cost", accessor: (l) => l.cost },
  { header: "Status", accessor: (l) => l.status },
];

const Maintenance = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ vehicle: "", serviceType: "", cost: "" });
  const [formError, setFormError] = useState("");
  const [closeLogId, setCloseLogId] = useState(null);

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get("/maintenance"),
        api.get("/vehicles"),
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load maintenance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useSocketRefresh([SOCKET_EVENTS.MAINTENANCE_UPDATE, SOCKET_EVENTS.VEHICLE_UPDATE], fetchData);

  const { items: pagedLogs, totalPages } = useMemo(() => paginate(logs, page, 10), [logs, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/maintenance", form);
      setForm({ vehicle: "", serviceType: "", cost: "" });
      addToast("Maintenance log created", "success");
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create log");
    }
  };

  const handleClose = async () => {
    if (!closeLogId) return;
    try {
      await api.patch(`/maintenance/${closeLogId}/close`);
      addToast("Maintenance closed", "success");
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to close maintenance", "error");
    }
  };

  const handleExportCsv = () => {
    const ok = exportToCsv(logs, EXPORT_COLS, "maintenance");
    if (ok) addToast("Maintenance exported to CSV", "success");
    else addToast("No logs to export", "error");
  };

  const handleExportPdf = () => {
    const ok = exportToPdf("Maintenance Logs", logs, EXPORT_COLS, "maintenance");
    if (ok) addToast("Maintenance exported to PDF", "success");
    else addToast("No logs to export", "error");
  };

  const columns = [
    { key: "vehicle", header: "Vehicle", render: (l) => l.vehicle?.registrationNumber },
    { key: "serviceType", header: "Service" },
    { key: "cost", header: "Cost", render: (l) => formatCurrency(l.cost) },
    { key: "status", header: "Status", render: (l) => <StatusBadge status={l.status} /> },
    {
      key: "action",
      header: "Action",
      render: (l) =>
        l.status === "Active" ? (
          <button onClick={() => setCloseLogId(l._id)} className="text-xs text-green-500 hover:underline">
            Close
          </button>
        ) : null,
    },
  ];

  if (loading) {
    return <Layout title="Maintenance"><LoadingSpinner size="lg" className="py-20" /></Layout>;
  }

  if (error) {
    return <Layout title="Maintenance"><ErrorState message={error} onRetry={fetchData} /></Layout>;
  }

  return (
    <Layout title="Maintenance">
      <div className="flex justify-end mb-4">
        <ExportButtons onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} disabled={!logs.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-3">Log Service Record</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white">
              <option value="">Select Vehicle</option>
              {vehicles.filter((v) => v.status !== "On Trip" && v.status !== "Retired").map((v) => (
                <option key={v._id} value={v._id}>{v.registrationNumber} — {v.nameModel}</option>
              ))}
            </select>
            <input placeholder="Service Type (e.g. Oil Change)" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            {formError && <p className="text-red-400 text-xs">✗ {formError}</p>}
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 rounded">
              Save
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Available → In Shop (on log creation)</p>
            <p className="text-xs text-gray-500">In Shop → Available (on close, unless Retired)</p>
          </div>
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-3">Service Log</p>
          <DataTable
            columns={columns}
            data={pagedLogs}
            emptyTitle="No maintenance logs"
            emptyMessage="Log a service record to get started."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!closeLogId}
        onClose={() => setCloseLogId(null)}
        onConfirm={handleClose}
        title="Close maintenance?"
        message="This will mark the maintenance as completed and restore the vehicle to Available."
        confirmLabel="Close Maintenance"
      />
    </Layout>
  );
};

export default Maintenance;
