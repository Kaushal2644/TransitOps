import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import SearchBar from "../components/ui/SearchBar";
import DataTable from "../components/ui/DataTable";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import ExportButtons from "../components/ui/ExportButtons";
import Pagination, { paginate } from "../components/ui/Pagination";
import { useAuth } from "../context/AuthContext";
import { useSocketRefresh } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { formatCurrency } from "../utils/formatters";
import { exportToCsv } from "../utils/exportCsv";
import { exportToPdf } from "../utils/exportPdf";

const emptyForm = {
  registrationNumber: "", nameModel: "", type: "Van",
  maxLoadCapacity: "", odometer: "", acquisitionCost: "", region: "",
};

const EXPORT_COLS = [
  { header: "Reg No", accessor: (v) => v.registrationNumber },
  { header: "Name/Model", accessor: (v) => v.nameModel },
  { header: "Type", accessor: (v) => v.type },
  { header: "Capacity", accessor: (v) => v.maxLoadCapacity },
  { header: "Odometer", accessor: (v) => v.odometer },
  { header: "Acq. Cost", accessor: (v) => v.acquisitionCost },
  { header: "Status", accessor: (v) => v.status },
];

const VehicleRegistry = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const canCreate = user?.role === "Fleet Manager";

  const fetchVehicles = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/vehicles", { params: { search } });
      setVehicles(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchVehicles();
  }, [fetchVehicles]);

  useSocketRefresh([SOCKET_EVENTS.VEHICLE_UPDATE], fetchVehicles);

  const { items: pagedVehicles, totalPages } = useMemo(
    () => paginate(vehicles, page, 10),
    [vehicles, page]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/vehicles", form);
      setShowForm(false);
      setForm(emptyForm);
      addToast("Vehicle added successfully", "success");
      fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to add vehicle");
    }
  };

  const handleExportCsv = () => {
    const ok = exportToCsv(vehicles, EXPORT_COLS, "vehicles");
    if (ok) addToast("Vehicles exported to CSV", "success");
    else addToast("No vehicles to export", "error");
  };

  const handleExportPdf = () => {
    const ok = exportToPdf("Vehicle Registry", vehicles, EXPORT_COLS, "vehicles");
    if (ok) addToast("Vehicles exported to PDF", "success");
    else addToast("No vehicles to export", "error");
  };

  const columns = [
    { key: "registrationNumber", header: "Reg No" },
    { key: "nameModel", header: "Name/Model" },
    { key: "type", header: "Type" },
    { key: "maxLoadCapacity", header: "Capacity", render: (v) => `${v.maxLoadCapacity} kg` },
    { key: "odometer", header: "Odometer" },
    { key: "acquisitionCost", header: "Acq. Cost", render: (v) => formatCurrency(v.acquisitionCost) },
    { key: "status", header: "Status", render: (v) => <StatusBadge status={v.status} /> },
  ];

  if (loading && vehicles.length === 0) {
    return <Layout title="Vehicle Registry"><LoadingSpinner size="lg" className="py-20" /></Layout>;
  }

  if (error && vehicles.length === 0) {
    return <Layout title="Vehicle Registry"><ErrorState message={error} onRetry={fetchVehicles} /></Layout>;
  }

  return (
    <Layout title="Vehicle Registry">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} className="w-full sm:w-64" />
        <div className="flex flex-wrap gap-2">
          <ExportButtons onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} disabled={!vehicles.length} />
          {canCreate && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded"
            >
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#12161c] border border-gray-800 rounded-lg p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {["registrationNumber", "nameModel", "maxLoadCapacity", "odometer", "acquisitionCost", "region"].map((field) => (
            <input
              key={field}
              placeholder={field}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white"
            />
          ))}
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white"
          >
            {["Van", "Truck", "Mini"].map((t) => <option key={t}>{t}</option>)}
          </select>
          {formError && <p className="col-span-full text-red-400 text-xs">✗ {formError}</p>}
          <button type="submit" className="col-span-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 rounded">
            Save Vehicle
          </button>
        </form>
      )}

      <div className="bg-[#12161c] border border-gray-800 rounded-lg overflow-hidden p-2">
        <DataTable
          columns={columns}
          data={pagedVehicles}
          emptyTitle="No vehicles found"
          emptyMessage="Add a vehicle or adjust your search."
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
      <p className="text-xs text-red-400 mt-2">
        Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
      </p>
    </Layout>
  );
};

export default VehicleRegistry;
