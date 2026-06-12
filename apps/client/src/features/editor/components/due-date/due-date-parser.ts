import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const DATE_FORMATS = [
  "MM/DD/YYYY",
  "MM/DD",
  "M/D",
  "MMMM D YYYY",
  "MMMM D",
  "MMM D YYYY",
  "MMM D",
  "dddd MMMM D YYYY",
  "dddd MMM D",
  "dddd MMMM D",
  "YYYY-MM-DD",
];

export interface DateSuggestion {
  label: string;
  sublabel: string;
  date: Date;
}

export function parseDateSuggestions(query: string): DateSuggestion[] {
  if (!query || query.trim().length < 2) return [];

  const results: DateSuggestion[] = [];
  const seen = new Set<string>();
  const now = dayjs();

  for (const fmt of DATE_FORMATS) {
    const normalized = query.trim().replace(/\b\w/g, c => c.toUpperCase());
    const parsed = dayjs(normalized, fmt, true);
    if (!parsed.isValid()) continue;

    // If no year in format, assume current year; if date has passed assume next year
    let resolved = parsed;
    if (!fmt.includes("YYYY")) {
      resolved = parsed.year(now.year());
      if (resolved.isBefore(now, "day")) {
        resolved = resolved.year(now.year() + 1);
      }
    }

    const key = resolved.format("YYYY-MM-DD");
    if (seen.has(key)) continue;
    seen.add(key);

    const diffDays = resolved.diff(now.startOf("day"), "day");
    let sublabel = resolved.format("dddd");
    if (diffDays === 0) sublabel = "Today";
    else if (diffDays === 1) sublabel = "Tomorrow";
    else if (diffDays <= 6) sublabel = `This ${resolved.format("dddd")}`;
    else if (diffDays <= 13) sublabel = `Next ${resolved.format("dddd")}`;
    else sublabel = `${resolved.format("dddd")} · in ${Math.ceil(diffDays / 7)} weeks`;

    results.push({
      label: resolved.format("MMMM D, YYYY"),
      sublabel,
      date: resolved.toDate(),
    });
  }

  return results.slice(0, 5);
}