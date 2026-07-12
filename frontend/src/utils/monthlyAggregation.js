const MONTH_LABEL = (date) =>
  new Date(date).toLocaleString("default", { month: "short", year: "2-digit" });

export const aggregateMonthlyCosts = (fuelLogs = [], maintenanceLogs = [], expenses = []) => {
  const map = {};

  const add = (date, amount) => {
    if (!date || amount == null) return;
    const key = MONTH_LABEL(date);
    map[key] = (map[key] || 0) + Number(amount);
  };

  fuelLogs.forEach((f) => add(f.date || f.createdAt, f.cost));
  maintenanceLogs.forEach((m) => add(m.date || m.createdAt, m.cost));
  expenses.forEach((e) => add(e.createdAt, e.total));

  return Object.entries(map)
    .map(([month, expenses]) => ({ month, expenses }))
    .sort((a, b) => {
      const parse = (s) => new Date(`1 ${s.replace(" ", " 20")}`);
      return parse(a.month) - parse(b.month);
    });
};
