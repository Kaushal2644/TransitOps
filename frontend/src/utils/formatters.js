export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleDateString();
};

export const formatPercent = (value) => `${Number(value) || 0}%`;
