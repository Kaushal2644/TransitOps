import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import ExportButtons from "../components/ui/ExportButtons";
import { useSocketRefresh } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { formatCurrency } from "../utils/formatters";
import { aggregateMonthlyCosts } from "../utils/monthlyAggregation";
import { exportToCsv } from "../utils/exportCsv";
import { exportAnalyticsPdf } from "../utils/exportPdf";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  RadialBarChart, RadialBar, PolarAngleAxis, Cell,
} from "recharts";

const CHART_TOOLTIP = { background: "#161b22", border: "1px solid #333", borderRadius: 6 };

const Reports = () => {
  const [data, setData] = useState(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const [analyticsRes, fuelRes, maintRes, expRes] = await Promise.all([
        api.get("/dashboard/analytics"),
        api.get("/fuel"),
        api.get("/maintenance"),
        api.get("/expenses"),
      ]);
      setData(analyticsRes.data);
      setMonthlyExpenses(
        aggregateMonthlyCosts(fuelRes.data, maintRes.data, expRes.data)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useSocketRefresh(
    [
      SOCKET_EVENTS.DASHBOARD_UPDATE,
      SOCKET_EVENTS.FUEL_UPDATE,
      SOCKET_EVENTS.EXPENSE_UPDATE,
      SOCKET_EVENTS.MAINTENANCE_UPDATE,
      SOCKET_EVENTS.TRIP_UPDATE,
    ],
    fetchData
  );

  const exportColumns = useMemo(() => {
    if (!data) return { roi: [], costliest: [], revenue: [], expenses: [] };
    return {
      roi: [
        { header: "Vehicle", accessor: (r) => r.vehicle },
        { header: "Revenue", accessor: (r) => r.revenue },
        { header: "Cost", accessor: (r) => r.cost },
        { header: "ROI %", accessor: (r) => r.roi },
      ],
      costliest: [
        { header: "Vehicle", accessor: (r) => r.vehicle },
        { header: "Total Cost", accessor: (r) => r.totalCost },
      ],
      revenue: [
        { header: "Month", accessor: (r) => r.month },
        { header: "Revenue", accessor: (r) => r.revenue },
      ],
      expenses: [
        { header: "Month", accessor: (r) => r.month },
        { header: "Expenses", accessor: (r) => r.expenses },
      ],
    };
  }, [data]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ...data.roiByVehicle.map((r) => ({ type: "ROI", ...r })),
      ...data.topCostliest.map((r) => ({ type: "Costliest", vehicle: r.vehicle, totalCost: r.totalCost })),
      ...data.monthlyRevenue.map((r) => ({ type: "Revenue", month: r.month, amount: r.revenue })),
      ...monthlyExpenses.map((r) => ({ type: "Expense", month: r.month, amount: r.expenses })),
    ];
    const ok = exportToCsv(
      rows,
      [
        { header: "Type", accessor: (r) => r.type },
        { header: "Label", accessor: (r) => r.vehicle || r.month },
        { header: "Value", accessor: (r) => r.roi ?? r.totalCost ?? r.amount ?? r.revenue },
      ],
      "transitops-analytics"
    );
    if (ok) addToast("Analytics exported to CSV", "success");
    else addToast("No data to export", "error");
  };

  const handleExportPdf = () => {
    if (!data) return;
    const ok = exportAnalyticsPdf(
      "TransitOps Analytics Report",
      [
        { label: "Fuel Efficiency", value: `${data.fuelEfficiency} km/l` },
        { label: "Fleet Utilization", value: `${data.fleetUtilization}%` },
        { label: "Operational Cost", value: formatCurrency(data.operationalCost) },
        { label: "Fleet Avg ROI", value: `${data.fleetAvgROI}%` },
      ],
      [
        { heading: "Vehicle ROI", columns: exportColumns.roi, rows: data.roiByVehicle },
        { heading: "Top Costliest", columns: exportColumns.costliest, rows: data.topCostliest },
        { heading: "Monthly Revenue", columns: exportColumns.revenue, rows: data.monthlyRevenue },
        { heading: "Monthly Expenses", columns: exportColumns.expenses, rows: monthlyExpenses },
      ],
      "transitops-analytics"
    );
    if (ok) addToast("Analytics exported to PDF", "success");
  };

  if (loading) {
    return (
      <Layout title="Reports & Analytics">
        <LoadingSpinner size="lg" className="py-20" />
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout title="Reports & Analytics">
        <ErrorState message={error || "No analytics data"} onRetry={fetchData} />
      </Layout>
    );
  }

  const costliestChart = data.topCostliest.map((v) => ({ name: v.vehicle, cost: v.totalCost }));
  const roiChart = [...data.roiByVehicle]
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 8)
    .map((r) => ({ name: r.vehicle, roi: r.roi }));
  const utilizationData = [{ name: "Utilization", value: data.fleetUtilization, fill: "#22c55e" }];

  return (
    <Layout title="Reports & Analytics">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <p className="text-xs text-gray-500">Live analytics — updates automatically</p>
        <ExportButtons onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Fuel Efficiency" value={`${data.fuelEfficiency} km/l`} />
        <KpiCard label="Fleet Utilization" value={`${data.fleetUtilization}%`} accent="text-green-400" />
        <KpiCard label="Operational Cost" value={formatCurrency(data.operationalCost)} />
        <KpiCard label="Vehicle ROI (avg)" value={`${data.fleetAvgROI}%`} accent="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-4">Monthly Revenue</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlyRevenue}>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [formatCurrency(v), "Revenue"]} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-4">Monthly Expenses</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyExpenses}>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [formatCurrency(v), "Expenses"]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-4">Fleet Utilization</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              barSize={16}
              data={utilizationData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8}>
                {utilizationData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </RadialBar>
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={24}>
                {data.fleetUtilization}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-4">Fuel Efficiency</p>
          <div className="flex flex-col items-center justify-center h-[240px]">
            <p className="text-5xl font-bold text-amber-400">{data.fuelEfficiency}</p>
            <p className="text-gray-400 text-sm mt-2">km per liter (fleet average)</p>
            <p className="text-gray-500 text-xs mt-4 text-center max-w-xs">
              Based on completed trip distance divided by fuel consumed
            </p>
          </div>
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-4">Vehicle ROI</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={roiChart} layout="vertical">
              <XAxis type="number" stroke="#666" fontSize={11} unit="%" />
              <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} width={70} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`${v}%`, "ROI"]} />
              <Bar dataKey="roi" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 font-medium mb-4">Top Costliest Vehicles</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costliestChart} layout="vertical">
              <XAxis type="number" stroke="#666" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
              <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} width={80} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [formatCurrency(v), "Cost"]} />
              <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
