import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import SearchBar from "../components/ui/SearchBar";
import DataTable from "../components/ui/DataTable";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import ExportButtons from "../components/ui/ExportButtons";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination, { paginate } from "../components/ui/Pagination";
import { useAuth } from "../context/AuthContext";
import { useSocketRefresh } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { formatDate } from "../utils/formatters";
import { exportToCsv } from "../utils/exportCsv";
import { exportToPdf } from "../utils/exportPdf";

const emptyForm = { name: "", licenseNumber: "", licenseCategory: "", licenseExpiry: "", contactNumber: "", safetyScore: 100 };

const EXPORT_COLS = [
  { header: "Name", accessor: (d) => d.name },
  { header: "License No", accessor: (d) => d.licenseNumber },
  { header: "Category", accessor: (d) => d.licenseCategory },
  { header: "Expiry", accessor: (d) => formatDate(d.licenseExpiry) },
  { header: "Contact", accessor: (d) => d.contactNumber },
  { header: "Safety Score", accessor: (d) => d.safetyScore },
  { header: "Status", accessor: (d) => d.status },
];

const Drivers = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState(null);

  const canCreate = ["Fleet Manager", "Safety Officer"].includes(user?.role);
  const canSuspend = user?.role === "Safety Officer";

  const fetchDrivers = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/drivers", { params: { search } });
      setDrivers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchDrivers();
  }, [fetchDrivers]);

  useSocketRefresh([SOCKET_EVENTS.DRIVER_UPDATE], fetchDrivers);

  const { items: pagedDrivers, totalPages } = useMemo(
    () => paginate(drivers, page, 10),
    [drivers, page]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/drivers", form);
      setShowForm(false);
      setForm(emptyForm);
      addToast("Driver added successfully", "success");
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to add driver");
    }
  };

  const handleToggleSuspend = async () => {
    if (!confirmSuspend) return;
    try {
      await api.patch(`/drivers/${confirmSuspend._id}/suspend`);
      addToast(
        confirmSuspend.status === "Suspended" ? "Driver unsuspended" : "Driver suspended",
        "success"
      );
      fetchDrivers();
    } catch (err) {
      addToast(err.response?.data?.message || "Action failed", "error");
    }
  };

  const handleExportCsv = () => {
    const ok = exportToCsv(drivers, EXPORT_COLS, "drivers");
    if (ok) addToast("Drivers exported to CSV", "success");
    else addToast("No drivers to export", "error");
  };

  const handleExportPdf = () => {
    const ok = exportToPdf("Drivers & Safety Profiles", drivers, EXPORT_COLS, "drivers");
    if (ok) addToast("Drivers exported to PDF", "success");
    else addToast("No drivers to export", "error");
  };

  const columns = [
    { key: "name", header: "Driver" },
    { key: "licenseNumber", header: "License No" },
    { key: "licenseCategory", header: "Category" },
    {
      key: "licenseExpiry",
      header: "Expiry",
      render: (d) => (
        <span className={d.isLicenseExpired ? "text-red-400" : ""}>
          {formatDate(d.licenseExpiry)} {d.isLicenseExpired && "EXPIRED"}
        </span>
      ),
    },
    { key: "contactNumber", header: "Contact" },
    { key: "tripCompletionRate", header: "Trip Compl.", render: (d) => `${d.tripCompletionRate}%` },
    { key: "safetyScore", header: "Safety", render: (d) => `${d.safetyScore}%` },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    ...(canSuspend
      ? [{
          key: "action",
          header: "Action",
          render: (d) => (
            <button
              onClick={() => setConfirmSuspend(d)}
              className="text-xs text-amber-500 hover:underline"
            >
              {d.status === "Suspended" ? "Unsuspend" : "Suspend"}
            </button>
          ),
        }]
      : []),
  ];

  if (loading && drivers.length === 0) {
    return <Layout title="Drivers & Safety Profiles"><LoadingSpinner size="lg" className="py-20" /></Layout>;
  }

  if (error && drivers.length === 0) {
    return <Layout title="Drivers & Safety Profiles"><ErrorState message={error} onRetry={fetchDrivers} /></Layout>;
  }

  return (
    <Layout title="Drivers & Safety Profiles">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} className="w-full sm:w-64" />
        <div className="flex flex-wrap gap-2">
          <ExportButtons onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} disabled={!drivers.length} />
          {canCreate && (
            <button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded">
              + Add Driver
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#12161c] border border-gray-800 rounded-lg p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input placeholder="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input placeholder="Category (LMV/HMV)" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input placeholder="Contact Number" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input type="number" placeholder="Safety Score" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          {formError && <p className="col-span-full text-red-400 text-xs">✗ {formError}</p>}
          <button type="submit" className="col-span-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 rounded">
            Save Driver
          </button>
        </form>
      )}

      <div className="bg-[#12161c] border border-gray-800 rounded-lg overflow-hidden p-2">
        <DataTable
          columns={columns}
          data={pagedDrivers}
          emptyTitle="No drivers found"
          emptyMessage="Add a driver or adjust your search."
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={!!confirmSuspend}
        onClose={() => setConfirmSuspend(null)}
        onConfirm={handleToggleSuspend}
        title={confirmSuspend?.status === "Suspended" ? "Unsuspend driver?" : "Suspend driver?"}
        message={`Are you sure you want to ${confirmSuspend?.status === "Suspended" ? "unsuspend" : "suspend"} ${confirmSuspend?.name}?`}
        confirmLabel={confirmSuspend?.status === "Suspended" ? "Unsuspend" : "Suspend"}
        danger={confirmSuspend?.status !== "Suspended"}
      />

      <p className="text-xs text-red-400 mt-2">
        Rule: Expired license or Suspended status → blocked from trip assignment
      </p>
    </Layout>
  );
};

export default Drivers;
