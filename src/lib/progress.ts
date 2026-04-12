export function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function getWeekStartDate(input: Date): Date {
  const date = new Date(input);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function addDays(input: Date, amount: number): Date {
  const date = new Date(input);
  date.setDate(date.getDate() + amount);
  return date;
}

export function getMonthKey(input: Date): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseMonthKey(value: string): Date {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, 1, 12, 0, 0, 0);
}

export function formatDurationClock(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
