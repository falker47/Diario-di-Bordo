import {
  addDays,
  endOfMonth,
  endOfYear,
  format,
  getISOWeek,
  getISOWeekYear,
  isValid,
  parse,
  parseISO,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { it } from "date-fns/locale";

const ISO_DATE_FORMAT = "yyyy-MM-dd";
const YEAR_MONTH_FORMAT = "yyyy-MM";
const ISO_WEEK_REGEX = /^(\d{4})-W(\d{2})$/;

export function todayISO(): string {
  return format(new Date(), ISO_DATE_FORMAT);
}

export function toISODate(date: Date): string {
  return format(date, ISO_DATE_FORMAT);
}

export function fromISODate(iso: string): Date {
  return parseISO(iso);
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const parsed = parse(iso, ISO_DATE_FORMAT, new Date());
  return isValid(parsed);
}

export function shiftDay(iso: string, deltaDays: number): string {
  return toISODate(addDays(parseISO(iso), deltaDays));
}

export function formatLongDate(iso: string): string {
  return format(parseISO(iso), "EEEE d MMMM yyyy", { locale: it });
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy", { locale: it });
}

export function formatTime(isoTimestamp: string): string {
  return format(parseISO(isoTimestamp), "HH:mm");
}

export function toISOWeekString(date: Date): string {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function fromISOWeekString(value: string): Date | null {
  const match = ISO_WEEK_REGEX.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  let date = new Date(year, 0, 4);
  date = setISOWeekYear(date, year);
  date = setISOWeek(date, week);
  return startOfISOWeek(date);
}

export function isValidISOWeekString(value: string): boolean {
  return fromISOWeekString(value) !== null;
}

export function weekDays(value: string): string[] {
  const start = fromISOWeekString(value);
  if (!start) return [];
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
}

export function toYearMonth(date: Date): string {
  return format(date, YEAR_MONTH_FORMAT);
}

export function fromYearMonth(value: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const parsed = parse(value, YEAR_MONTH_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function isValidYearMonth(value: string): boolean {
  return fromYearMonth(value) !== null;
}

export function monthDays(value: string): string[] {
  const anchor = fromYearMonth(value);
  if (!anchor) return [];
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const out: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) {
    out.push(toISODate(d));
  }
  return out;
}

export function isValidYear(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export function yearDays(year: number): string[] {
  const first = startOfYear(new Date(year, 0, 1));
  const last = endOfYear(first);
  const out: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) {
    out.push(toISODate(d));
  }
  return out;
}
