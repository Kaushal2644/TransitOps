const RBAC_MATRIX = [
  { role: "Fleet Manager", fleet: "✓", drivers: "✓", trips: "✓", fuel: "✓", analytics: "✓" },
  { role: "Dispatcher", fleet: "view", drivers: "view", trips: "✓", fuel: "view", analytics: "—" },
  { role: "Safety Officer", fleet: "—", drivers: "✓", trips: "view", fuel: "—", analytics: "view" },
  { role: "Financial Analyst", fleet: "view", drivers: "—", trips: "—", fuel: "✓", analytics: "✓" },
];

import Layout from "../components/Layout";

const SettingsPage = () => (
  <Layout title="Settings & RBAC">
    <div className="grid grid-cols-2 gap-5">
      <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-300 font-medium mb-3">General</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Depot Name</label>
            <input className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" placeholder="Gandhinagar Depot" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Currency</label>
            <input className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" placeholder="INR (₹)" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Distance Unit</label>
            <input className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white" placeholder="Kilometers" />
          </div>
          <button className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded">
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-300 font-medium mb-3">Role-Based Access (RBAC)</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-left border-b border-gray-800">
              <th className="pb-2">Role</th><th>Fleet</th><th>Drivers</th><th>Trips</th><th>Fuel/Exp</th><th>Analytics</th>
            </tr>
          </thead>
          <tbody>
            {RBAC_MATRIX.map((r) => (
              <tr key={r.role} className="border-b border-gray-900 text-gray-300">
                <td className="py-2">{r.role}</td>
                <td>{r.fleet}</td>
                <td>{r.drivers}</td>
                <td>{r.trips}</td>
                <td>{r.fuel}</td>
                <td>{r.analytics}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
);

export default SettingsPage;