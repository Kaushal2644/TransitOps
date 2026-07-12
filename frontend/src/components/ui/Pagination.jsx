const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-300 disabled:opacity-40 hover:bg-[#161b22]"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-300 disabled:opacity-40 hover:bg-[#161b22]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;

export const paginate = (items, page, pageSize = 10) => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
};
