import { Inbox } from "lucide-react";

const EmptyState = ({ title = "No data found", message = "There is nothing to display yet." }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Inbox size={40} className="text-gray-600 mb-3" />
    <p className="text-gray-300 text-sm font-medium">{title}</p>
    <p className="text-gray-500 text-xs mt-1 max-w-xs">{message}</p>
  </div>
);

export default EmptyState;
