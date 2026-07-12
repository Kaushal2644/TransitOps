import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import DataTable from "../components/ui/DataTable";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import ExportButtons from "../components/ui/ExportButtons";
import Pagination, { paginate } from "../components/ui/Pagination";
import { useSocketRefresh } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { formatCurrency, formatDate } from "../utils/formatters";
import { exportToCsv } from "../utils/exportCsv";
import { exportToPdf } from "../utils/exportPdf";

const FUEL_EXPORT_COLS = [
  { header: "Vehicle", accessor: (f) => f.vehicle?.registrationNumber },
  { header: "Date", accessor: (f) => formatDate(f.date) },
  { header: "Liters", accessor: (f) => f.liters },
  { header: "Cost", accessor: (f) => f.cost },
];

const EXPENSE_EXPORT_COLS = [
  { header: "Trip", accessor: (e) => e.trip?.tripCode || "--" },
  { header: "Vehicle", accessor: (e) => e.vehicle?.registrationNumber },
  { header: "Toll", accessor: (e) => e.toll },
  { header: "Other", accessor: (e) => e.other },
  { header: "Maint. Linked", accessor: (e) => e.maintenanceLinked },
  { header: "Total", accessor: (e) => e.total },
];

const FuelExpense = () => {
  const { addToast } = useToast();
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [opCost, setOpCost] = useState({ grandTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fuelPage, setFuelPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicle: "", liters: "", cost: "" });
  const [expenseForm, setExpenseForm] = useState({ vehicle: "", toll: "", other: "" });
  const [fuelError, setFuelError] = useState("");
  const [expenseError, setExpenseError] = useState("");

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const [fuelRes, expRes, vehRes, costRes] = await Promise.all([
        api.get("/fuel"),
        api.get("/expenses"),
        api.get("/vehicles"),
        api.get("/expenses/operational-cost"),
      ]);
      setFuelLogs(fuelRes.data);
      setExpenses(expRes.data);
      setVehicles(vehRes.data);
      setOpCost(costRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load fuel & expense data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useSocketRefresh([SOCKET_EVENTS.FUEL_UPDATE, SOCKET_EVENTS.EXPENSE_UPDATE], fetchData);

  const { items: pagedFuel, totalPages: fuelTotalPages } = useMemo(
    () => paginate(fuelLogs, fuelPage, 10),
    [fuelLogs, fuelPage]
  );
  const { items: pagedExpenses, totalPages: expenseTotalPages } = useMemo(
    () => paginate(expenses, expensePage, 10),
    [expenses, expensePage]
  );

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFuelError("");
    try {
      await api.post("/fuel", fuelForm);
      setFuelForm({ vehicle: "", liters: "", cost: "" });
      setShowFuelForm(false);
      addToast("Fuel log saved", "success");
      fetchData();
    } catch (err) {
      setFuelError(err.response?.data?.message || "Failed to save fuel log");
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseError("");
    try {
      await api.post("/expenses", expenseForm);
      setExpenseForm({ vehicle: "", toll: "", other: "" });
      setShowExpenseForm(false);
      addToast("Expense saved", "success");
      fetchData();
    } catch (err) {
      setExpenseError(err.response?.data?.message || "Failed to save expense");
    }
  };

  const handleExportFuelCsv = () => {
    const ok = exportToCsv(fuelLogs, FUEL_EXPORT_COLS, "fuel-logs");
    if (ok) addToast("Fuel logs exported to CSV", "success");
    else addToast("No fuel logs to export", "error");
  };

  const handleExportFuelPdf = () => {
    const ok = exportToPdf("Fuel Logs", fuelLogs, FUEL_EXPORT_COLS, "fuel-logs");
    if (ok) addToast("Fuel logs exported to PDF", "success");
    else addToast("No fuel logs to export", "error");
  };

  const handleExportExpenseCsv = () => {
    const ok = exportToCsv(expenses, EXPENSE_EXPORT_COLS, "expenses");
    if (ok) addToast("Expenses exported to CSV", "success");
    else addToast("No expenses to export", "error");
  };

  const handleExportExpensePdf = () => {
    const ok = exportToPdf("Expenses", expenses, EXPENSE_EXPORT_COLS, "expenses");
    if (ok) addToast("Expenses exported to PDF", "success");
    else addToast("No expenses to export", "error");
  };

  const fuelColumns = [
    { key: "vehicle", header: "Vehicle", render: (f) => f.vehicle?.registrationNumber },
    { key: "date", header: "Date", render: (f) => formatDate(f.date) },
    { key: "liters", header: "Liters", render: (f) => `${f.liters} L` },
    { key: "cost", header: "Cost", render: (f) => formatCurrency(f.cost) },
  ];

  const expenseColumns = [
    { key: "trip", header: "Trip", render: (e) => e.trip?.tripCode || "--" },
    { key: "vehicle", header: "Vehicle", render: (e) => e.vehicle?.registrationNumber },
    { key: "toll", header: "Toll", render: (e) => formatCurrency(e.toll) },
    { key: "other", header: "Other", render: (e) => formatCurrency(e.other) },
    { key: "maintenanceLinked", header: "Maint. (Linked)", render: (e) => formatCurrency(e.maintenanceLinked) },
    { key: "total", header: "Total", render: (e) => <span className="font-medium text-white">{formatCurrency(e.total)}</span> },
  ];

  if (loading) {
    return <Layout title="Fuel & Expense Management"><LoadingSpinner size="lg" className="py-20" /></Layout>;
  }

  if (error) {
    return <Layout title="Fuel & Expense Management"><ErrorState message={error} onRetry={fetchData} /></Layout>;
  }

  return (
    <Layout title="Fuel & Expense Management">
      <div className="flex flex-wrap gap-3 mb-5">
        <button onClick={() => setShowFuelForm(!showFuelForm)} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded">
          + Log Fuel
        </button>
        <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded">
          + Add Expense
        </button>
      </div>

      {showFuelForm && (
        <form onSubmit={handleFuelSubmit} className="bg-[#12161c] border border-gray-800 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={fuelForm.vehicle} onChange={(e) => setFuelForm({ ...fuelForm, vehicle: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white">
            <option value="">Vehicle</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber}</option>)}
          </select>
          <input type="number" placeholder="Liters" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input type="number" placeholder="Cost" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          {fuelError && <p className="col-span-full text-red-400 text-xs">✗ {fuelError}</p>}
          <button type="submit" className="col-span-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 rounded">Save Fuel Log</button>
        </form>
      )}

      {showExpenseForm && (
        <form onSubmit={handleExpenseSubmit} className="bg-[#12161c] border border-gray-800 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={expenseForm.vehicle} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white">
            <option value="">Vehicle</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber}</option>)}
          </select>
          <input type="number" placeholder="Toll" value={expenseForm.toll} onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          <input type="number" placeholder="Other" value={expenseForm.other} onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })} className="bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" />
          {expenseError && <p className="col-span-full text-red-400 text-xs">✗ {expenseError}</p>}
          <button type="submit" className="col-span-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 rounded">Save Expense</button>
        </form>
      )}

      <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4 mb-5">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <p className="text-sm text-gray-300 font-medium">Fuel Logs</p>
          <ExportButtons onExportCsv={handleExportFuelCsv} onExportPdf={handleExportFuelPdf} disabled={!fuelLogs.length} />
        </div>
        <DataTable
          columns={fuelColumns}
          data={pagedFuel}
          emptyTitle="No fuel logs"
          emptyMessage="Log fuel entries to track consumption."
        />
        <Pagination page={fuelPage} totalPages={fuelTotalPages} onPageChange={setFuelPage} />
      </div>

      <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <p className="text-sm text-gray-300 font-medium">Other Expenses (Toll / Misc)</p>
          <ExportButtons onExportCsv={handleExportExpenseCsv} onExportPdf={handleExportExpensePdf} disabled={!expenses.length} />
        </div>
        <DataTable
          columns={expenseColumns}
          data={pagedExpenses}
          emptyTitle="No expenses"
          emptyMessage="Add toll or misc expenses to track costs."
        />
        <Pagination page={expensePage} totalPages={expenseTotalPages} onPageChange={setExpensePage} />
        <div className="flex justify-end mt-3 pt-3 border-t border-gray-800">
          <p className="text-sm text-gray-300">
            Total Operational Cost (Auto) = Fuel + Maintenance:{" "}
            <span className="text-white font-semibold">{formatCurrency(opCost.grandTotal)}</span>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default FuelExpense;
