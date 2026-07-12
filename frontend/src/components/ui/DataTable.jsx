import EmptyState from "./EmptyState";

const DataTable = ({ columns, data, keyField = "_id", emptyTitle, emptyMessage }) => {
  if (!data?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="text-gray-500 text-xs text-left border-b border-gray-800">
            {columns.map((col) => (
              <th key={col.key} className={`p-3 ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]} className="border-b border-gray-900 text-gray-300 hover:bg-[#161b22]/50">
              {columns.map((col) => (
                <td key={col.key} className={`p-3 ${col.className || ""}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
