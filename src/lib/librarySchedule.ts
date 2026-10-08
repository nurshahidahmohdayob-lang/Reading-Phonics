/* When each class has its library lesson, from the teacher's timetable.

   A child's assignment story changes once per library session: on their
   class's library day they get the next story at their level, and it stays
   until the following week's session. Dates are school dates in Malaysia
   (Asia/Kuala_Lumpur), written YYYY-MM-DD.

     Monday     Year 2  (10:55)
     Tuesday    Year 1  (13:50)
     Wednesday  Year 4  (08:30), Year 3 (09:10), Year 5 (10:55)
     Thursday   Year 6  (09:10)

   A class with no library lesson listed changes story every school day. */

/** Library weekday per class: 0 Sunday … 6 Saturday. */
export const LIBRARY_DAY: Record<string, number> = { y1: 2, y2: 1, y3: 3, y4: 3, y5: 3, y6: 4 };

const DAY_MS = 86_400_000;

/** Today's date at school. */
export function schoolToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

/** The school date a moment in time falls on. */
export function schoolDateOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(d: string, n: number): string {
  return fromMs(toMs(d) + n * DAY_MS);
}

/** The library session a class is in on a date: its most recent library
    day, that day included. Classes without one: the date itself. */
export function sessionOn(yearKey: string, date = schoolToday()): string {
  const day = LIBRARY_DAY[yearKey];
  if (day === undefined) return date;
  const dow = new Date(toMs(date)).getUTCDay();
  return addDays(date, -((dow - day + 7) % 7));
}

/** The current session and the ones after it: `count` dates in all. */
export function sessionsFrom(yearKey: string, count: number, date = schoolToday()): string[] {
  const first = sessionOn(yearKey, date);
  const step = LIBRARY_DAY[yearKey] === undefined ? 1 : 7;
  return Array.from({ length: count }, (_, i) => addDays(first, i * step));
}

/** How many sessions apart two session dates are. */
export function sessionsBetween(yearKey: string, from: string, to: string): number {
  const days = Math.round((toMs(to) - toMs(from)) / DAY_MS);
  return LIBRARY_DAY[yearKey] === undefined ? days : Math.round(days / 7);
}
