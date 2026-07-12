const KpiCard = ({ label, value, accent }) => (
  <div className="bg-[#12161c] border border-gray-800 rounded-lg p-4">
    <p className="text-xs text-gray-400 mb-2">{label}</p>
    <p className={`text-2xl font-semibold ${accent || "text-white"}`}>{value}</p>
  </div>
);

export default KpiCard;