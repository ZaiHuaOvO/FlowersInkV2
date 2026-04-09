export interface YearGroupedItem<T> {
  year: string;
  data: T[];
}

export function sortByDateDesc<T>(
  items: T[],
  getDate: (item: T) => Date
): T[] {
  return [...items].sort(
    (a, b) => getDate(b).getTime() - getDate(a).getTime()
  );
}

export function groupByYearDesc<T>(
  items: T[],
  getDate: (item: T) => Date
): YearGroupedItem<T>[] {
  const grouped = items.reduce((acc, item) => {
    const year = getDate(item).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = { year, data: [] };
    }
    acc[year].data.push(item);
    return acc;
  }, {} as Record<string, YearGroupedItem<T>>);

  return Object.values(grouped).sort(
    (a, b) => Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10)
  );
}
