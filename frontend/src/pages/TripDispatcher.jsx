import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ExportButtons from "../components/ui/ExportButtons";
import { useSocketRefresh } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { exportToCsv } from "../utils/exportCsv";
import { exportToPdf } from "../utils/exportPdf";

const STAGES = ["Draft", "Dispatched", "Completed", "Cancelled"];

const EXPORT_COLS = [
  { header: "Trip Code", accessor: (t) => t.tripCode },
  { header: "Source", accessor: (t) => t.source },
  { header: "Destination", accessor: (t) => t.destination },
  { header: "Vehicle", accessor: (t) => t.vehicle?.registrationNumber || "--" },
  { header: "Driver", accessor: (t) => t.driver?.name || "--" },
  { header: "Status", accessor: (t) => t.status },
  { header: "Cargo (kg)", accessor: (t) => t.cargoWeight },
  { header: "Distance (km)", accessor: (t) => t.plannedDistance },
];

const TripDispatcher = () => {
  const { addToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [eligible, setEligible] = useState({ vehicles: [], drivers: [] });
  const [form, setForm] = useState({ source: "", destination: "", vehicle: "", driver: "", cargoWeight: "", plannedDistance: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [completeModal, setCompleteModal] = useState(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: "", fuelConsumed: "", revenue: "0" });
  const [cancelTripId, setCancelTripId] = useState(null);

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const [tripsRes, eligibleRes] = await Promise.all([
        api.get("/trips"),
        api.get("/trips/eligible-resources"),
      ]);
      setTrips(tripsRes.data);
      setEligible(eligibleRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useSocketRefresh(
    [SOCKET_EVENTS.TRIP_UPDATE, SOCKET_EVENTS.VEHICLE_UPDATE, SOCKET_EVENTS.DRIVER_UPDATE],
    fetchData
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/trips", form);
      setForm({ source: "", destination: "", vehicle: "", driver: "", cargoWeight: "", plannedDistance: "" });
      addToast("Trip created successfully", "success");
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create trip");
    }
  };

  const handleDispatch = async (id) => {
    setFormError("");
    try {
      await api.patch(`/trips/${id}/dispatch`);
      addToast("Trip dispatched", "success");
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Dispatch failed");
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!completeModal) return;
    try {
      await api.patch(`/trips/${completeModal}/complete`, {
        finalOdometer: +completeForm.finalOdometer,
        fuelConsumed: +completeForm.fuelConsumed,
        revenue: +completeForm.revenue || 0,
      });
      setCompleteModal(null);
      setCompleteForm({ finalOdometer: "", fuelConsumed: "", revenue: "0" });
      addToast("Trip completed", "success");
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || "Complete failed", "error");
    }
  };

  const handleCancel = async () => {
    if (!cancelTripId) return;
    try {
      await api.patch(`/trips/${cancelTripId}/cancel`);
      addToast("Trip cancelled", "success");
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || "Cancel failed", "error");
    }
  };

  const handleExportCsv = () => {
    const ok = exportToCsv(trips, EXPORT_COLS, "trips");
    if (ok) addToast("Trips exported to CSV", "success");
    else addToast("No trips to export", "error");
  };

  const handleExportPdf = () => {
    const ok = exportToPdf("Trip Dispatcher", trips, EXPORT_COLS, "trips");
    if (ok) addToast("Trips exported to PDF", "success");
    else addToast("No trips to export", "error");
  };

  if (loading) {
    return <Layout title="Trip Dispatcher"><LoadingSpinner size="lg" className="py-20" /></Layout>;
  }

  if (error) {
    return <Layout title="Trip Dispatcher"><ErrorState message={error} onRetry={fetchData} /></Layout>;
  }

  return (
    <Layout title="Trip Dispatcher">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <span className={`w-3 h-3 rounded-full ${i === 0 ? "bg-green-500" : "bg-gray-600"}`} />
              <span className="text-xs text-gray-400">{s}</span>
              {i < STAGES.length - 1 && <span className="w-6 h-px bg-gray-700" />}
            </div>
          ))}
        </div>
        <ExportButtons onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} disabled={!trips.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-3">Create Trip</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input placeholder="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            <input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />

            <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white">
              <option value="">Vehicle (Available only)</option>
              {eligible.vehicles.map((v) => (
                <option key={v._id} value={v._id}>{v.registrationNumber} — {v.maxLoadCapacity}kg capacity</option>
              ))}
            </select>

            <select value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white">
              <option value="">Driver (Available only)</option>
              {eligible.drivers.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

            <input type="number" placeholder="Cargo Weight (kg)" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Planned Distance (km)" value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />

            {formError && (
              <div className="border border-red-900 bg-red-950/40 rounded p-2 text-xs text-red-400">✗ {formError}</div>
            )}

            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 rounded">
              Create Draft Trip
            </button>
          </form>
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-3">Live Board</p>
          {trips.length === 0 ? (
            <EmptyState title="No trips yet" message="Create a draft trip to get started." />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {trips.map((t) => (
                <div key={t._id} className="border border-gray-800 rounded p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm text-white font-medium">{t.tripCode}</p>
                      <p className="text-xs text-gray-500">{t.source} → {t.destination}</p>
                      <p className="text-xs text-gray-500">
                        {t.vehicle?.registrationNumber || "No vehicle"} / {t.driver?.name || "No driver"}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {t.status === "Draft" && (
                      <>
                        <button onClick={() => handleDispatch(t._id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                          Dispatch
                        </button>
                        <button onClick={() => setCancelTripId(t._id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">
                          Cancel
                        </button>
                      </>
                    )}
                    {t.status === "Dispatched" && (
                      <>
                        <button onClick={() => setCompleteModal(t._id)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">
                          Complete
                        </button>
                        <button onClick={() => setCancelTripId(t._id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!completeModal} onClose={() => setCompleteModal(null)} title="Complete Trip">
        <form onSubmit={handleComplete} className="space-y-3">
          <input type="number" required placeholder="Final odometer" value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input type="number" required placeholder="Fuel consumed (L)" value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input type="number" placeholder="Trip revenue (optional)" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded">
            Complete Trip
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!cancelTripId}
        onClose={() => setCancelTripId(null)}
        onConfirm={handleCancel}
        title="Cancel trip?"
        message="This will cancel the trip and restore vehicle/driver availability if dispatched."
        confirmLabel="Cancel Trip"
        danger
      />
    </Layout>
  );
};

export default TripDispatcher;
