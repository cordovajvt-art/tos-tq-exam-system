export const bloomLevels = ['remembering','understanding','applying','analyzing','evaluating','creating'];

export function summarizeTos(rows) {
  const totalHours = rows.reduce((sum,row) => sum + row.hours, 0);
  const totalPoints = rows.reduce((sum,row) => sum + row.points, 0);
  const totals = Object.fromEntries(bloomLevels.map((level) => [level, rows.reduce((sum,row) => sum + row[level], 0)]));
  const totalItems = Object.values(totals).reduce((sum,value) => sum + value, 0);
  const normalizedRows = rows.map((row) => ({ ...row, items: bloomLevels.reduce((sum,key) => sum + row[key], 0), hoursPercentage: Number((row.hours / totalHours * 100).toFixed(2)), pointsPercentage: totalPoints ? Number((row.points / totalPoints * 100).toFixed(2)) : 0 }));
  const percentages = Object.fromEntries(bloomLevels.map((level) => [level, Number((totals[level] / totalItems * 100).toFixed(2))]));
  return { normalizedRows, totals, percentages, totalItems };
}
