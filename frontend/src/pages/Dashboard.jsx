import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import DataTable from "../components/ui/DataTable";
import { useSocketRefresh } from "../context/SocketContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ type: "All", status: "All", region: "All" });

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const params = {};
      if (filters.type !== "All") params.type = filters.type;
      if (filters.region !== "All") params.region = filters.region;

      const [kpiRes, tripsRes] = await Promise.all([
        api.get("/dashboard/kpis", { params }),
        api.get("/dashboard/recent-trips"),
      ]);
      setKpis(kpiRes.data);
      setRecentTrips(tripsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useSocketRefresh(
    [
      SOCKET_EVENTS.DASHBOARD_UPDATE,
      SOCKET_EVENTS.TRIP_UPDATE,
      SOCKET_EVENTS.VEHICLE_UPDATE,
      SOCKET_EVENTS.DRIVER_UPDATE,
    ],
    fetchData
  );

  if (loading && !kpis) {
    return (
      <Layout title="Dashboard">
        <LoadingSpinner size="lg" className="py-20" />
      </Layout>
    );
  }

  if (error && !kpis) {
    return (
      <Layout title="Dashboard">
        <ErrorState message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  const statusEntries = Object.entries(kpis.statusBreakdown);
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);

  const tripColumns = [
    { key: "tripCode", header: "Trip" },
    { key: "vehicle", header: "Vehicle", render: (t) => t.vehicle?.registrationNumber || "--" },
    { key: "driver", header: "Driver", render: (t) => t.driver?.name || "--" },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    { key: "eta", header: "ETA", render: () => <span className="text-gray-500">--</span> },
  ];

  return (
    <Layout title="Dashboard">
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="bg-[#161b22] border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300"
        >
          {["All", "Van", "Truck", "Mini"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-[#161b22] border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300"
        >
          {["All", "Available", "On Trip", "In Shop", "Retired"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          placeholder="Region"
          value={filters.region === "All" ? "" : filters.region}
          onChange={(e) => setFilters({ ...filters, region: e.target.value || "All" })}
          className="bg-[#161b22] border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        <KpiCard label="Active Vehicles" value={kpis.activeVehicles} />
        <KpiCard label="Available Vehicles" value={kpis.availableVehicles} />
        <KpiCard label="Vehicles in Maintenance" value={kpis.vehiclesInMaintenance} />
        <KpiCard label="Active Trips" value={kpis.activeTrips} accent="text-blue-400" />
        <KpiCard label="Pending Trips" value={kpis.pendingTrips} />
        <KpiCard label="Drivers On Duty" value={kpis.driversOnDuty} />
        <KpiCard label="Fleet Utilization" value={`${kpis.fleetUtilization}%`} accent="text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-3">Recent Trips</p>
          <DataTable
            columns={tripColumns}
            data={recentTrips}
            emptyTitle="No recent trips"
            emptyMessage="Trips will appear here once created."
          />
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-4">Vehicle Status</p>
          {statusEntries.length === 0 ? (
            <EmptyState title="No status data" />
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded">
                    <div
                      className={`h-2 rounded ${
                        status === "Available" ? "bg-green-500" :
                        status === "On Trip" ? "bg-blue-500" :
                        status === "In Shop" ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
