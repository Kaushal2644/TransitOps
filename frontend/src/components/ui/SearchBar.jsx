import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, placeholder = "Search...", className = "" }) => (
  <div className={`relative ${className}`}>
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#161b22] border border-gray-700 rounded pl-9 pr-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-amber-600"
    />
  </div>
);

export default SearchBar;
